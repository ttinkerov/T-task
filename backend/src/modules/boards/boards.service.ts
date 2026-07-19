import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ColumnAutomationAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateColumnAutomationsDto } from './dto/update-column-automations.dto';
import { countOverdueDays, isTaskOverdue, nextRolledDueDate } from './utils/overdue.util';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async getBoard(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { autoRollOverdue: true },
    });

    let board = await this.fetchBoard(workspaceId);

    if (workspace.autoRollOverdue) {
      await this.rollOverdueTasks(board);
      board = await this.fetchBoard(workspaceId);
    }

    return {
      id: board.id,
      workspaceId: board.workspaceId,
      name: board.name,
      columns: board.columns.map((column) => ({
        id: column.id,
        name: column.name,
        position: column.position,
        automations: column.automations.map((automation) => ({
          id: automation.id,
          action: automation.action,
          assigneeId: automation.assigneeId,
          assignee: automation.assignee,
        })),
        tasks: column.tasks.map((task) => this.serializeTask(task)),
      })),
    };
  }

  private async fetchBoard(workspaceId: string) {
    const board = await this.prisma.board.findFirst({
      where: { workspaceId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            automations: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
            tasks: {
              where: { deletedAt: null },
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
                customFieldValues: {
                  select: { fieldId: true, value: true },
                },
                taskTags: {
                  include: { tag: { select: { id: true, name: true, color: true } } },
                  orderBy: { tag: { name: 'asc' } },
                },
                subtasks: {
                  orderBy: { position: 'asc' },
                  select: { id: true, title: true, completed: true, position: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  private async rollOverdueTasks(board: {
    columns: Array<{
      id: string;
      name: string;
      position: number;
      tasks: Array<{
        id: string;
        dueDate: Date | null;
      }>;
    }>;
  }) {
    const columns = board.columns;
    const updates: Array<ReturnType<typeof this.prisma.task.update>> = [];

    for (const column of columns) {
      for (const task of column.tasks) {
        if (!isTaskOverdue(task, column, columns)) {
          continue;
        }

        updates.push(
          this.prisma.task.update({
            where: { id: task.id },
            data: {
              dueDate: nextRolledDueDate(),
              overdueDays: countOverdueDays(task.dueDate!),
            },
          }),
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  async getBoardForWorkspace(workspaceId: string) {
    const board = await this.prisma.board.findFirst({
      where: { workspaceId },
      select: { id: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async createColumn(workspaceId: string, userId: string, dto: CreateColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);

    const lastColumn = await this.prisma.boardColumn.findFirst({
      where: { boardId: board.id },
      orderBy: { position: 'desc' },
    });

    const column = await this.prisma.$transaction(async (tx) => {
      const created = await tx.boardColumn.create({
        data: {
          boardId: board.id,
          name: dto.name.trim(),
          position: (lastColumn?.position ?? -1) + 1,
        },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.COLUMN_CREATED,
        entityType: ActivityEntityType.COLUMN,
        entityId: created.id,
        entityName: created.name,
      });
      return created;
    });

    return {
      id: column.id,
      name: column.name,
      position: column.position,
      automations: [],
      tasks: [],
    };
  }

  async updateColumn(workspaceId: string, columnId: string, userId: string, dto: UpdateColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);

    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const renamed = await tx.boardColumn.update({
        where: { id: columnId },
        data: { name: dto.name.trim() },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.COLUMN_UPDATED,
        entityType: ActivityEntityType.COLUMN,
        entityId: renamed.id,
        entityName: renamed.name,
        metadata: { previousName: column.name },
      });
      return renamed;
    });

    return {
      id: updated.id,
      name: updated.name,
      position: updated.position,
    };
  }

  async updateColumnAutomations(
    workspaceId: string,
    columnId: string,
    userId: string,
    dto: UpdateColumnAutomationsDto,
  ) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);
    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    if (dto.startTimer && dto.completeTask) {
      throw new BadRequestException('A column cannot start a timer and complete a task together');
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.assignUserId) {
        const membership = await tx.workspaceMember.findFirst({
          where: {
            workspaceId,
            userId: dto.assignUserId,
            user: { deletedAt: null },
          },
        });

        if (!membership) {
          throw new BadRequestException('Automation assignee must be a workspace member');
        }
      }

      const automations = [
        ...(dto.assignUserId
          ? [
              {
                columnId,
                action: ColumnAutomationAction.ASSIGN_USER,
                assigneeId: dto.assignUserId,
                position: 0,
              },
            ]
          : []),
        ...(dto.startTimer
          ? [
              {
                columnId,
                action: ColumnAutomationAction.START_TIMER,
                assigneeId: null,
                position: 1,
              },
            ]
          : []),
        ...(dto.completeTask
          ? [
              {
                columnId,
                action: ColumnAutomationAction.COMPLETE_TASK,
                assigneeId: null,
                position: 2,
              },
            ]
          : []),
      ];

      await tx.columnAutomation.deleteMany({ where: { columnId } });
      if (automations.length > 0) {
        await tx.columnAutomation.createMany({ data: automations });
      }
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.COLUMN_AUTOMATIONS_UPDATED,
        entityType: ActivityEntityType.AUTOMATION,
        entityId: columnId,
        entityName: column.name,
        metadata: { automationCount: automations.length },
      });
    });

    return this.getColumnAutomations(workspaceId, columnId, userId);
  }

  async getColumnAutomations(workspaceId: string, columnId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: columnId,
        board: { workspaceId },
      },
      include: {
        automations: {
          orderBy: { position: 'asc' },
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    return column.automations.map((automation) => ({
      id: automation.id,
      action: automation.action,
      assigneeId: automation.assigneeId,
      assignee: automation.assignee,
    }));
  }

  async deleteColumn(workspaceId: string, columnId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);

    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const columnCount = await this.prisma.boardColumn.count({
      where: { boardId: board.id },
    });

    if (columnCount <= 1) {
      throw new BadRequestException('Cannot delete the last column');
    }

    const trashedTasks = await this.prisma.task.count({
      where: { columnId, deletedAt: { not: null } },
    });

    if (trashedTasks > 0) {
      throw new ConflictException(
        'В колонке есть задачи в корзине. Восстановите или удалите их навсегда перед удалением колонки.',
      );
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.boardColumn.delete({ where: { id: columnId } });

      const remaining = await tx.boardColumn.findMany({
        where: { boardId: board.id },
        orderBy: { position: 'asc' },
      });

      await Promise.all(
        remaining.map((item, index) =>
          tx.boardColumn.update({
            where: { id: item.id },
            data: { position: index },
          }),
        ),
      );
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.COLUMN_DELETED,
        entityType: ActivityEntityType.COLUMN,
        entityId: column.id,
        entityName: column.name,
      });
    });

    return { success: true };
  }

  async moveColumn(workspaceId: string, columnId: string, userId: string, dto: MoveColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);

    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.reorderColumns(tx, board.id, columnId, dto.position);
    });

    const updated = await this.prisma.boardColumn.findUniqueOrThrow({ where: { id: columnId } });

    return {
      id: updated.id,
      name: updated.name,
      position: updated.position,
    };
  }

  serializeTask(task: {
    id: string;
    title: string;
    description: string | null;
    priority: import('@prisma/client').TaskPriority | null;
    complexity: number | null;
    timeEstimateMinutes: number | null;
    actualMinutes: number | null;
    dueDate: Date | null;
    assigneeId?: string | null;
    position: number;
    columnId: string;
    recurrenceRule: import('@prisma/client').TaskRecurrenceRule;
    recurrenceAction: import('@prisma/client').TaskRecurrenceAction;
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
    customFieldValues?: {
      fieldId: string;
      value: import('@prisma/client').Prisma.JsonValue;
    }[];
    taskTags?: {
      tag: { id: string; name: string; color: string };
    }[];
    subtasks?: {
      id: string;
      title: string;
      completed: boolean;
      position: number;
    }[];
  }) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      complexity: task.complexity,
      timeEstimateMinutes: task.timeEstimateMinutes,
      actualMinutes: task.actualMinutes,
      dueDate: task.dueDate?.toISOString() ?? null,
      assigneeId: task.assigneeId ?? null,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
            avatarUrl: task.assignee.avatarUrl,
          }
        : null,
      position: task.position,
      columnId: task.columnId,
      recurrenceRule: task.recurrenceRule,
      recurrenceAction: task.recurrenceAction,
      recurrenceWeekdays: task.recurrenceWeekdays,
      recurrenceOriginColumnId: task.recurrenceOriginColumnId,
      overdueDays: task.overdueDays,
      timerStartedAt: task.timerStartedAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      customFields: (task.customFieldValues ?? []).map((entry) => ({
        fieldId: entry.fieldId,
        value: entry.value,
      })),
      tags: (task.taskTags ?? []).map((entry) => entry.tag),
      subtasks: (task.subtasks ?? []).map((entry) => ({
        id: entry.id,
        title: entry.title,
        completed: entry.completed,
        position: entry.position,
      })),
    };
  }

  private async reorderColumns(
    tx: Prisma.TransactionClient,
    boardId: string,
    columnId: string,
    newPosition: number,
  ) {
    const columns = await tx.boardColumn.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    const moving = columns.find((item) => item.id === columnId);
    if (!moving) return;

    const without = columns.filter((item) => item.id !== columnId);
    without.splice(newPosition, 0, moving);

    await Promise.all(
      without.map((item, index) =>
        tx.boardColumn.update({
          where: { id: item.id },
          data: { position: index },
        }),
      ),
    );
  }
}
