import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ColumnAutomationAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateColumnAutomationsDto } from './dto/update-column-automations.dto';
import { createDefaultBoard } from './utils/create-default-board.util';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';
import { resolveDescriptionDocForApi } from '../tasks/utils/description-doc.util';

const BOARD_COLUMN_TASK_LIMIT = 50;

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async listBoards(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const boards = await this.prisma.board.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, workspaceId: true, name: true, createdAt: true, updatedAt: true },
    });

    return boards.map((board) => ({
      id: board.id,
      workspaceId: board.workspaceId,
      name: board.name,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
    }));
  }

  async createBoard(workspaceId: string, userId: string, dto: CreateBoardDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const board = await this.prisma.$transaction(async (tx) => {
      return createDefaultBoard(tx, workspaceId, dto.name.trim(), dto.templateId);
    });

    return {
      id: board.id,
      workspaceId: board.workspaceId,
      name: board.name,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
    };
  }

  async getBoard(workspaceId: string, userId: string, boardId?: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const board = await this.fetchBoard(workspaceId, boardId);
    return this.serializeBoard(board);
  }

  async listColumnTasks(
    workspaceId: string,
    boardId: string,
    columnId: string,
    userId: string,
    offset = 0,
    limit = BOARD_COLUMN_TASK_LIMIT,
  ) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: columnId,
        deletedAt: null,
        boardId,
        board: { workspaceId },
      },
      select: { id: true },
    });

    if (!column) {
      throw new NotFoundException('Колонка не найдена');
    }

    const take = Math.min(Math.max(limit, 1), BOARD_COLUMN_TASK_LIMIT);
    const skip = Math.max(offset, 0);

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({
        where: { columnId, deletedAt: null },
      }),
      this.prisma.task.findMany({
        where: { columnId, deletedAt: null },
        orderBy: { position: 'asc' },
        skip,
        take,
        select: this.boardCardTaskSelect(true),
      }),
    ]);

    const loadedThrough = skip + tasks.length;

    return {
      columnId,
      items: tasks.map((task) => this.serializeTask(task)),
      total,
      offset: skip,
      limit: take,
      truncated: loadedThrough < total,
    };
  }

  async updateBoard(workspaceId: string, boardId: string, userId: string, dto: UpdateBoardDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.resolveBoardForWorkspace(workspaceId, boardId);

    const updated = await this.prisma.board.update({
      where: { id: boardId },
      data: { name: dto.name.trim() },
      select: { id: true, workspaceId: true, name: true, createdAt: true, updatedAt: true },
    });

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      name: updated.name,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteBoard(workspaceId: string, boardId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.resolveBoardForWorkspace(workspaceId, boardId);

    const boardCount = await this.prisma.board.count({ where: { workspaceId } });
    if (boardCount <= 1) {
      throw new BadRequestException('Нельзя удалить последнюю доску в пространстве');
    }

    await this.prisma.board.delete({ where: { id: boardId } });

    return { success: true };
  }

  private serializeBoard(board: {
    id: string;
    workspaceId: string;
    name: string;
    columns: Array<{
      id: string;
      name: string;
      position: number;
      wipLimit?: number | null;
      _count: { tasks: number };
      automations: Array<{
        id: string;
        action: ColumnAutomationAction;
        assigneeId: string | null;
        config?: Prisma.JsonValue | null;
        assignee: {
          id: string;
          name: string;
          email: string;
          avatarUrl: string | null;
        } | null;
      }>;
      tasks: Array<Parameters<BoardsService['serializeTask']>[0]>;
    }>;
  }) {
    return {
      id: board.id,
      workspaceId: board.workspaceId,
      name: board.name,
      columns: board.columns.map((column) => ({
        id: column.id,
        name: column.name,
        position: column.position,
        wipLimit: column.wipLimit ?? null,
        taskTotal: column._count.tasks,
        truncated: column.tasks.length < column._count.tasks,
        automations: column.automations.map((automation) => ({
          id: automation.id,
          action: automation.action,
          assigneeId: automation.assigneeId,
          config: automation.config ?? null,
          assignee: automation.assignee,
        })),
        tasks: column.tasks.map((task) => this.serializeTask(task)),
      })),
    };
  }

  private async fetchBoard(workspaceId: string, boardId?: string) {
    const board = await this.prisma.board.findFirst({
      where: boardId ? { id: boardId, workspaceId } : { workspaceId },
      orderBy: { createdAt: 'asc' },
      include: {
        columns: {
          where: { deletedAt: null },
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
              take: BOARD_COLUMN_TASK_LIMIT,
              select: this.boardCardTaskSelect(true),
            },
            _count: {
              select: {
                tasks: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Доска не найдена');
    }

    return board;
  }

  private boardCardTaskSelect(includeCardFields: boolean) {
    return {
      id: true,
      title: true,

      priority: true,
      complexity: true,
      timeEstimateMinutes: true,
      actualMinutes: true,
      dueDate: true,
      assigneeId: true,
      position: true,
      columnId: true,
      recurrenceRule: true,
      recurrenceAction: true,
      recurrenceWeekdays: true,
      recurrenceOriginColumnId: true,
      overdueDays: true,
      timerStartedAt: true,
      completedAt: true,
      createdAt: true,
      sprintId: true,
      isEpic: true,
      epicId: true,
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      ...(includeCardFields
        ? {
            customFieldValues: {
              select: { fieldId: true, value: true },
            },
          }
        : {}),
      taskTags: {
        include: { tag: { select: { id: true, name: true, color: true } } },
        orderBy: { tag: { name: 'asc' as const } },
      },
      _count: {
        select: {
          subtasks: true,
        },
      },
      subtasks: {
        where: { completed: true },
        select: { id: true },
      },
    };
  }

  async getBoardForWorkspace(workspaceId: string) {
    return this.resolveBoardForWorkspace(workspaceId);
  }

  private async resolveBoardForWorkspace(workspaceId: string, boardId?: string) {
    const board = await this.prisma.board.findFirst({
      where: boardId ? { id: boardId, workspaceId } : { workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!board) {
      throw new NotFoundException('Доска не найдена');
    }

    return board;
  }

  private async findColumnInWorkspace(workspaceId: string, columnId: string) {
    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, board: { workspaceId } },
    });

    if (!column) {
      throw new NotFoundException('Колонка не найдена');
    }

    return column;
  }

  async createColumn(workspaceId: string, userId: string, dto: CreateColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.resolveBoardForWorkspace(workspaceId, dto.boardId);

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
        tx,
      });
      return created;
    });

    return {
      id: column.id,
      name: column.name,
      position: column.position,
      wipLimit: null,
      automations: [],
      tasks: [],
    };
  }

  async updateColumn(workspaceId: string, columnId: string, userId: string, dto: UpdateColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const column = await this.findColumnInWorkspace(workspaceId, columnId);

    if (dto.name === undefined && dto.wipLimit === undefined) {
      throw new BadRequestException('Нечего обновлять');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const renamed = await tx.boardColumn.update({
        where: { id: columnId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.wipLimit !== undefined ? { wipLimit: dto.wipLimit } : {}),
        },
      });
      if (dto.name !== undefined && dto.name.trim() !== column.name) {
        await this.activityService.record({
          workspaceId,
          actorId: userId,
          action: ActivityAction.COLUMN_UPDATED,
          entityType: ActivityEntityType.COLUMN,
          entityId: renamed.id,
          entityName: renamed.name,
          metadata: { previousName: column.name },
          tx,
        });
      }
      return renamed;
    });

    return {
      id: updated.id,
      name: updated.name,
      position: updated.position,
      wipLimit: updated.wipLimit,
    };
  }

  async updateColumnAutomations(
    workspaceId: string,
    columnId: string,
    userId: string,
    dto: UpdateColumnAutomationsDto,
  ) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const column = await this.findColumnInWorkspace(workspaceId, columnId);

    if (dto.startTimer && dto.completeTask) {
      throw new BadRequestException(
        'Колонка не может одновременно запускать таймер и завершать задачу',
      );
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
          throw new BadRequestException(
            'Исполнитель автоматизации должен быть участником пространства',
          );
        }
      }

      const automations = [
        ...(dto.assignUserId
          ? [
              {
                columnId,
                action: ColumnAutomationAction.ASSIGN_USER,
                assigneeId: dto.assignUserId,
                config: Prisma.JsonNull,
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
                config: Prisma.JsonNull,
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
                config: Prisma.JsonNull,
                position: 2,
              },
            ]
          : []),
        ...(dto.notifyWatchers
          ? [
              {
                columnId,
                action: ColumnAutomationAction.NOTIFY_WATCHERS,
                assigneeId: null,
                config: {
                  message: dto.notifyMessage?.trim() || null,
                } as Prisma.InputJsonValue,
                position: 3,
              },
            ]
          : []),
        ...(dto.customFieldId
          ? [
              {
                columnId,
                action: ColumnAutomationAction.SET_CUSTOM_FIELD,
                assigneeId: null,
                config: {
                  fieldId: dto.customFieldId,
                  value: dto.customFieldValue ?? null,
                } as Prisma.InputJsonValue,
                position: 4,
              },
            ]
          : []),
        ...(dto.webhookUrl?.trim()
          ? [
              {
                columnId,
                action: ColumnAutomationAction.WEBHOOK,
                assigneeId: null,
                config: {
                  url: dto.webhookUrl.trim(),
                } as Prisma.InputJsonValue,
                position: 5,
              },
            ]
          : []),
      ];

      if (dto.customFieldId) {
        const field = await tx.customFieldDefinition.findFirst({
          where: { id: dto.customFieldId, workspaceId },
          select: { id: true },
        });
        if (!field) {
          throw new BadRequestException('Поле автоматизации не найдено в пространстве');
        }
      }

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
        tx,
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
      throw new NotFoundException('Колонка не найдена');
    }

    return column.automations.map((automation) => ({
      id: automation.id,
      action: automation.action,
      assigneeId: automation.assigneeId,
      config: automation.config ?? null,
      assignee: automation.assignee,
    }));
  }

  async deleteColumn(workspaceId: string, columnId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const column = await this.findColumnInWorkspace(workspaceId, columnId);

    const columnCount = await this.prisma.boardColumn.count({
      where: { boardId: column.boardId },
    });

    if (columnCount <= 1) {
      throw new BadRequestException('Нельзя удалить последнюю колонку');
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
        where: { boardId: column.boardId },
        orderBy: { position: 'asc' },
      });

      const updates = remaining.map((item, index) => ({ id: item.id, position: index }));
      const changed = updates.filter((u, index) => remaining[index]?.position !== u.position);
      if (changed.length > 0) {
        await tx.$executeRaw(buildColumnReorderSql(changed));
      }

      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.COLUMN_DELETED,
        entityType: ActivityEntityType.COLUMN,
        entityId: column.id,
        entityName: column.name,
        tx,
      });
    });

    return { success: true };
  }

  async moveColumn(workspaceId: string, columnId: string, userId: string, dto: MoveColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const column = await this.findColumnInWorkspace(workspaceId, columnId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.reorderColumns(tx, column.boardId, columnId, dto.position);
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
    description?: string | null;
    descriptionDoc?: import('@prisma/client').Prisma.JsonValue | null;
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
    sprintId?: string | null;
    isEpic?: boolean;
    epicId?: string | null;
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
    _count?: {
      subtasks?: number;
    };
    subtasks?: {
      id?: string;
      title?: string;
      completed?: boolean;
      position?: number;
    }[];
  }) {
    const fullSubtasks =
      task._count === undefined
        ? (task.subtasks ?? []).map((entry, index) => ({
            id: entry.id ?? `subtask-${index}`,
            title: entry.title ?? '',
            completed: Boolean(entry.completed),
            position: entry.position ?? index,
          }))
        : [];
    const subtaskTotal = task._count?.subtasks ?? fullSubtasks.length ?? task.subtasks?.length ?? 0;
    const subtaskCompleted =
      task._count !== undefined
        ? (task.subtasks?.length ?? 0)
        : fullSubtasks.filter((entry) => entry.completed).length;

    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,

      descriptionDoc: resolveDescriptionDocForApi(task.descriptionDoc ?? null, null),
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
      sprintId: task.sprintId ?? null,
      isEpic: Boolean(task.isEpic),
      epicId: task.epicId ?? null,
      customFields: (task.customFieldValues ?? []).map((entry) => ({
        fieldId: entry.fieldId,
        value: entry.value,
      })),
      tags: (task.taskTags ?? []).map((entry) => entry.tag),
      subtaskStats: {
        total: subtaskTotal,
        completed: subtaskCompleted,
      },
      subtasks: fullSubtasks,
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

    const updates = without.map((item, index) => ({ id: item.id, position: index }));
    const changed = updates.filter((u) => {
      const original = columns.find((c) => c.id === u.id);
      return original?.position !== u.position;
    });
    if (changed.length === 0) return;

    await tx.$executeRaw(buildColumnReorderSql(changed));
  }
}

export function buildColumnReorderSql(entries: { id: string; position: number }[]): Prisma.Sql {
  const cases = Prisma.join(
    entries.map((e) => Prisma.sql`WHEN id = ${e.id} THEN ${e.position}`),
    ' ',
  );
  const ids = Prisma.join(entries.map((e) => e.id));
  return Prisma.sql`UPDATE board_columns SET position = CASE ${cases} END WHERE id IN (${ids})`;
}
