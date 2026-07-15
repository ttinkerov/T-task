import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskRecurrenceAction, TaskRecurrenceRule } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { computeNextRecurrenceDate, isDoneColumn } from './utils/recurrence.util';

const taskWithAssignee = {
  assignee: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
} as const;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly boardsService: BoardsService,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateTaskDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.boardsService.getBoardForWorkspace(workspaceId);

    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: dto.columnId,
        board: { workspaceId },
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const lastTask = await this.prisma.task.findFirst({
      where: { columnId: column.id },
      orderBy: { position: 'desc' },
    });

    const position = (lastTask?.position ?? -1) + 1;

    const task = await this.prisma.task.create({
      data: {
        columnId: column.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        position,
      },
      include: taskWithAssignee,
    });

    return this.toTask(task);
  }

  async update(workspaceId: string, taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: dto.assigneeId },
        },
      });

      if (!membership) {
        throw new BadRequestException('Assignee must be a workspace member');
      }
    }

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.complexity !== undefined ? { complexity: dto.complexity } : {}),
        ...(dto.timeEstimateMinutes !== undefined
          ? { timeEstimateMinutes: dto.timeEstimateMinutes }
          : {}),
        ...(dto.actualMinutes !== undefined ? { actualMinutes: dto.actualMinutes } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
        ...(dto.recurrenceRule !== undefined
          ? this.buildRecurrenceUpdate(task, dto.recurrenceRule, dto)
          : {}),
        ...(dto.recurrenceAction !== undefined ? { recurrenceAction: dto.recurrenceAction } : {}),
        ...(dto.recurrenceWeekdays !== undefined
          ? { recurrenceWeekdays: dto.recurrenceWeekdays }
          : {}),
        ...(dto.recurrenceOriginColumnId !== undefined
          ? { recurrenceOriginColumnId: dto.recurrenceOriginColumnId }
          : {}),
      },
      include: taskWithAssignee,
    });

    return this.toTask(updated);
  }

  async move(workspaceId: string, taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    const targetColumn = await this.prisma.boardColumn.findFirst({
      where: {
        id: dto.columnId,
        board: { workspaceId },
      },
    });

    if (!targetColumn) {
      throw new NotFoundException('Column not found');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (task.columnId === dto.columnId) {
        await this.reorderWithinColumn(tx, task.columnId, taskId, dto.position);
        return;
      }

      await this.closeGap(tx, task.columnId, task.position);
      await this.makeSpace(tx, dto.columnId, dto.position);
      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: dto.columnId,
          position: dto.position,
        },
      });
    });

    const board = await this.prisma.board.findFirstOrThrow({
      where: { workspaceId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });

    const doneColumn = board.columns.find((column) => column.id === dto.columnId);
    const movedTask = await this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: taskWithAssignee,
    });

    if (
      doneColumn &&
      isDoneColumn(doneColumn, board.columns) &&
      movedTask.recurrenceRule !== TaskRecurrenceRule.NONE
    ) {
      await this.handleRecurrenceCompletion(movedTask, board.columns);
    }

    const updated = await this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: taskWithAssignee,
    });
    return this.toTask(updated);
  }

  private buildRecurrenceUpdate(
    task: { columnId: string; recurrenceOriginColumnId: string | null },
    recurrenceRule: TaskRecurrenceRule,
    dto: UpdateTaskDto,
  ) {
    if (recurrenceRule === TaskRecurrenceRule.NONE) {
      return {
        recurrenceRule,
        recurrenceWeekdays: [],
        recurrenceOriginColumnId: null,
      };
    }

    return {
      recurrenceRule,
      recurrenceOriginColumnId:
        dto.recurrenceOriginColumnId ?? task.recurrenceOriginColumnId ?? task.columnId,
    };
  }

  private async handleRecurrenceCompletion(
    task: {
      id: string;
      columnId: string;
      title: string;
      description: string | null;
      priority: TaskPriority | null;
      complexity: number | null;
      timeEstimateMinutes: number | null;
      assigneeId: string | null;
      position: number;
      dueDate: Date | null;
      recurrenceRule: TaskRecurrenceRule;
      recurrenceAction: TaskRecurrenceAction;
      recurrenceWeekdays: number[];
      recurrenceOriginColumnId: string | null;
    },
    columns: { id: string; position: number }[],
  ) {
    const originColumnId =
      task.recurrenceOriginColumnId ?? columns.find((column) => column.position === 0)?.id;

    if (!originColumnId) {
      return;
    }

    const nextDueDate = computeNextRecurrenceDate(
      task.dueDate ?? new Date(),
      task.recurrenceRule,
      task.recurrenceWeekdays,
    );

    if (task.recurrenceAction === TaskRecurrenceAction.DUPLICATE) {
      await this.prisma.$transaction(async (tx) => {
        const lastTask = await tx.task.findFirst({
          where: { columnId: originColumnId },
          orderBy: { position: 'desc' },
        });
        const position = (lastTask?.position ?? -1) + 1;

        await tx.task.create({
          data: {
            columnId: originColumnId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            complexity: task.complexity,
            timeEstimateMinutes: task.timeEstimateMinutes,
            assigneeId: task.assigneeId,
            dueDate: nextDueDate,
            position,
            recurrenceRule: task.recurrenceRule,
            recurrenceAction: task.recurrenceAction,
            recurrenceWeekdays: task.recurrenceWeekdays,
            recurrenceOriginColumnId: originColumnId,
          },
        });
      });
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await this.closeGap(tx, task.columnId, task.position);

      const lastTask = await tx.task.findFirst({
        where: { columnId: originColumnId },
        orderBy: { position: 'desc' },
      });
      const position = (lastTask?.position ?? -1) + 1;
      await this.makeSpace(tx, originColumnId, position);

      await tx.task.update({
        where: { id: task.id },
        data: {
          columnId: originColumnId,
          position,
          dueDate: nextDueDate,
          actualMinutes: null,
          recurrenceOriginColumnId: originColumnId,
        },
      });
    });
  }

  async remove(workspaceId: string, taskId: string, userId: string) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.task.delete({ where: { id: taskId } });
      await this.closeGap(tx, task.columnId, task.position);
    });

    return { success: true };
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        column: { board: { workspaceId } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async reorderWithinColumn(
    tx: Prisma.TransactionClient,
    columnId: string,
    taskId: string,
    newPosition: number,
  ) {
    const tasks = await tx.task.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
    });

    const moving = tasks.find((item) => item.id === taskId);
    if (!moving) return;

    const without = tasks.filter((item) => item.id !== taskId);
    without.splice(newPosition, 0, moving);

    await Promise.all(
      without.map((item, index) =>
        tx.task.update({
          where: { id: item.id },
          data: { position: index },
        }),
      ),
    );
  }

  private async closeGap(tx: Prisma.TransactionClient, columnId: string, removedPosition: number) {
    const tasks = await tx.task.findMany({
      where: { columnId, position: { gt: removedPosition } },
      orderBy: { position: 'asc' },
    });

    await Promise.all(
      tasks.map((item) =>
        tx.task.update({
          where: { id: item.id },
          data: { position: item.position - 1 },
        }),
      ),
    );
  }

  private async makeSpace(tx: Prisma.TransactionClient, columnId: string, position: number) {
    const tasks = await tx.task.findMany({
      where: { columnId, position: { gte: position } },
      orderBy: { position: 'desc' },
    });

    await Promise.all(
      tasks.map((item) =>
        tx.task.update({
          where: { id: item.id },
          data: { position: item.position + 1 },
        }),
      ),
    );
  }

  private toTask(task: {
    id: string;
    title: string;
    description: string | null;
    priority: TaskPriority | null;
    complexity: number | null;
    timeEstimateMinutes: number | null;
    actualMinutes: number | null;
    dueDate: Date | null;
    assigneeId: string | null;
    position: number;
    columnId: string;
    recurrenceRule: TaskRecurrenceRule;
    recurrenceAction: TaskRecurrenceAction;
    recurrenceWeekdays: number[];
    recurrenceOriginColumnId: string | null;
    createdAt: Date;
    assignee?: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    } | null;
  }) {
    return this.boardsService.serializeTask(task);
  }
}
