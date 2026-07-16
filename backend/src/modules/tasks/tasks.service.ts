import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ColumnAutomationAction,
  Prisma,
  TaskPriority,
  TaskRecurrenceAction,
  TaskRecurrenceRule,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { buildAutomationTaskUpdate } from './utils/column-automation.util';
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
      include: {
        automations: {
          orderBy: { position: 'asc' },
          select: { action: true, assigneeId: true },
        },
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const lastTask = await this.prisma.task.findFirst({
      where: { columnId: column.id, deletedAt: null },
      orderBy: { position: 'desc' },
    });

    const position = (lastTask?.position ?? -1) + 1;
    const executableAutomations = await this.filterExecutableAutomations(
      workspaceId,
      column.automations.filter(
        (automation) => automation.action !== ColumnAutomationAction.COMPLETE_TASK,
      ),
    );
    const automationUpdate = buildAutomationTaskUpdate(
      executableAutomations,
      { actualMinutes: null, timerStartedAt: null, completedAt: null },
      new Date(),
    );

    const task = await this.prisma.task.create({
      data: {
        columnId: column.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        position,
        ...automationUpdate,
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

    if (dto.recurrenceOriginColumnId) {
      await this.assertColumnInWorkspace(workspaceId, dto.recurrenceOriginColumnId);
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
          ? {
              dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
              overdueDays: 0,
            }
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
      include: {
        automations: {
          orderBy: { position: 'asc' },
          select: { action: true, assigneeId: true },
        },
      },
    });

    if (!targetColumn) {
      throw new NotFoundException('Column not found');
    }

    const board = await this.prisma.board.findFirstOrThrow({
      where: { workspaceId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });

    const movingToDone = isDoneColumn(targetColumn, board.columns);
    const executableAutomations = await this.filterExecutableAutomations(
      workspaceId,
      targetColumn.automations,
    );

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (task.columnId === dto.columnId) {
        await this.reorderWithinColumn(tx, task.columnId, taskId, dto.position);
        return;
      }

      const currentTask = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
      const automationUpdate = buildAutomationTaskUpdate(
        executableAutomations,
        currentTask,
        new Date(),
      );

      await this.closeGap(tx, task.columnId, task.position);
      await this.makeSpace(tx, dto.columnId, dto.position);
      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: dto.columnId,
          position: dto.position,
          ...(movingToDone ? { overdueDays: 0 } : {}),
          ...automationUpdate,
        },
      });
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
      await this.handleRecurrenceCompletion(workspaceId, movedTask, board.columns);
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

  private async filterExecutableAutomations(
    workspaceId: string,
    automations: Array<{
      action: ColumnAutomationAction;
      assigneeId: string | null;
    }>,
  ) {
    const assignment = automations.find(
      (automation) => automation.action === ColumnAutomationAction.ASSIGN_USER,
    );

    if (!assignment?.assigneeId) {
      return automations.filter(
        (automation) => automation.action !== ColumnAutomationAction.ASSIGN_USER,
      );
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: assignment.assigneeId,
        user: { deletedAt: null },
      },
      select: { id: true },
    });

    if (membership) {
      return automations;
    }

    return automations.filter(
      (automation) => automation.action !== ColumnAutomationAction.ASSIGN_USER,
    );
  }

  private async handleRecurrenceCompletion(
    workspaceId: string,
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
    const columnIds = new Set(columns.map((column) => column.id));
    const preferredOrigin =
      task.recurrenceOriginColumnId && columnIds.has(task.recurrenceOriginColumnId)
        ? task.recurrenceOriginColumnId
        : null;
    const originColumnId =
      preferredOrigin ?? columns.find((column) => column.position === 0)?.id ?? null;

    if (!originColumnId || !columnIds.has(originColumnId)) {
      return;
    }

    await this.assertColumnInWorkspace(workspaceId, originColumnId);

    const nextDueDate = computeNextRecurrenceDate(
      task.dueDate ?? new Date(),
      task.recurrenceRule,
      task.recurrenceWeekdays,
    );

    const assigneeId = await this.resolveWorkspaceAssigneeId(workspaceId, task.assigneeId);

    if (task.recurrenceAction === TaskRecurrenceAction.DUPLICATE) {
      await this.prisma.$transaction(async (tx) => {
        const lastTask = await tx.task.findFirst({
          where: { columnId: originColumnId, deletedAt: null },
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
            assigneeId,
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
        where: { columnId: originColumnId, deletedAt: null },
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
          completedAt: null,
          timerStartedAt: null,
          recurrenceOriginColumnId: originColumnId,
        },
      });
    });
  }

  async remove(workspaceId: string, taskId: string, userId: string) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.task.update({
        where: { id: taskId },
        data: { deletedAt: new Date() },
      });
      await this.closeGap(tx, task.columnId, task.position);
    });

    return { success: true };
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async assertColumnInWorkspace(workspaceId: string, columnId: string) {
    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: columnId,
        board: { workspaceId },
      },
      select: { id: true },
    });

    if (!column) {
      throw new BadRequestException('Column must belong to this workspace');
    }

    return column;
  }

  private async resolveWorkspaceAssigneeId(workspaceId: string, assigneeId: string | null) {
    if (!assigneeId) {
      return null;
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: assigneeId,
        user: { deletedAt: null },
      },
      select: { id: true },
    });

    return membership ? assigneeId : null;
  }

  private async reorderWithinColumn(
    tx: Prisma.TransactionClient,
    columnId: string,
    taskId: string,
    newPosition: number,
  ) {
    const tasks = await tx.task.findMany({
      where: { columnId, deletedAt: null },
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
      where: { columnId, deletedAt: null, position: { gt: removedPosition } },
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
      where: { columnId, deletedAt: null, position: { gte: position } },
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
    overdueDays: number;
    timerStartedAt: Date | null;
    completedAt: Date | null;
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
