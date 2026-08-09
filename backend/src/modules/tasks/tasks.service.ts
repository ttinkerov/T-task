import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ColumnAutomationAction,
  MentionSourceType,
  Prisma,
  TaskPriority,
  TaskRecurrenceAction,
  TaskRecurrenceRule,
} from '@prisma/client';
import { DomainEvents } from '../../common/events/domain-events';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { extractMentionUserIds } from '../mentions/mention-parser.util';
import { MentionsService } from '../mentions/mentions.service';
import { WatchersService } from '../watchers/watchers.service';
import { TaskChecklistService } from '../dod/task-checklist.service';
import { TaskTemplatesService } from '../templates/task-templates.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateTasksDto } from './dto/bulk-update-tasks.dto';
import { TaskRelationsService } from './task-relations.service';
import { buildAutomationTaskUpdate } from './utils/column-automation.util';
import { computeNextRecurrenceDate, isDoneColumn } from './utils/recurrence.util';
import {
  normalizeDescriptionDocInput,
  descriptionDocFromPlain,
} from './utils/description-doc.util';

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
    private readonly taskRelationsService: TaskRelationsService,
    private readonly mentionsService: MentionsService,
    private readonly watchersService: WatchersService,
    private readonly taskChecklistService: TaskChecklistService,
    private readonly taskTemplatesService: TaskTemplatesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getById(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      include: {
        ...taskWithAssignee,
        customFieldValues: { select: { fieldId: true, value: true } },
        taskTags: {
          include: { tag: { select: { id: true, name: true, color: true } } },
          orderBy: { tag: { name: 'asc' } },
        },
        subtasks: {
          orderBy: { position: 'asc' },
          select: { id: true, title: true, completed: true, position: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    return this.boardsService.serializeTask(task);
  }

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
      throw new NotFoundException('Колонка не найдена');
    }

    let epicId: string | null = null;
    if (dto.epicId) {
      const epic = await this.prisma.task.findFirst({
        where: {
          id: dto.epicId,
          isEpic: true,
          deletedAt: null,
          column: { board: { workspaceId } },
        },
        select: { id: true },
      });
      if (!epic) {
        throw new BadRequestException('Эпик не найден');
      }
      epicId = epic.id;
    }

    const template = dto.templateId
      ? await this.taskTemplatesService.getForApply(workspaceId, dto.templateId)
      : null;
    const templateDefaults = template
      ? this.taskTemplatesService.taskFieldDefaults(template)
      : null;

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
    const descriptionSource = dto.description?.trim() || templateDefaults?.description || null;
    const preparedDescription = descriptionSource
      ? await this.mentionsService.prepare(workspaceId, userId, descriptionSource)
      : { text: null, recipientIds: [] as string[] };
    const title = dto.title.trim() || templateDefaults?.title || 'Новая задача';

    const task = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.task.create({
        data: {
          columnId: column.id,
          title: title.slice(0, 200),
          description: preparedDescription.text,
          descriptionDoc: preparedDescription.text
            ? (descriptionDocFromPlain(
                preparedDescription.text,
              ) as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          priority: templateDefaults?.priority ?? null,
          complexity: templateDefaults?.complexity ?? null,
          timeEstimateMinutes: templateDefaults?.timeEstimateMinutes ?? null,
          position,
          epicId,
          ...automationUpdate,
        },
        include: taskWithAssignee,
      });

      if (template) {
        await this.taskTemplatesService.applyInTransaction(tx, workspaceId, created.id, template);
      }

      await this.mentionsService.notify(
        tx,
        {
          workspaceId,
          actorId: userId,
          taskId: created.id,
          sourceType: MentionSourceType.TASK_DESCRIPTION,
          preview: preparedDescription.text ?? created.title,
        },
        preparedDescription.recipientIds,
      );

      return created;
    });

    this.eventEmitter.emit(DomainEvents.TASK_CHANGED, {
      workspaceId,
      taskId: task.id,
    });

    return this.toTask(task);
  }

  async update(workspaceId: string, taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    let descriptionUpdate:
      | {
          description: string | null;
          descriptionDoc: Prisma.InputJsonValue | typeof Prisma.JsonNull;
        }
      | undefined;
    let mentionRecipientIds: string[] = [];
    let mentionPreview: string | null = null;

    if (dto.descriptionDoc !== undefined || dto.description !== undefined) {
      let normalized;
      try {
        normalized = normalizeDescriptionDocInput(dto.descriptionDoc, dto.description);
      } catch {
        throw new BadRequestException('Некорректный формат описания');
      }
      if (normalized !== 'unchanged') {
        const preparedDescription =
          normalized.plain !== null
            ? await this.mentionsService.prepare(workspaceId, userId, normalized.plain)
            : { text: null, recipientIds: [] as string[] };
        descriptionUpdate = {
          description: preparedDescription.text,
          descriptionDoc:
            normalized.doc === null
              ? Prisma.JsonNull
              : (normalized.doc as unknown as Prisma.InputJsonValue),
        };
        mentionRecipientIds = preparedDescription.recipientIds;
        mentionPreview = preparedDescription.text;
      }
    }

    const previousMentionIds = new Set(extractMentionUserIds(task.description));
    const newRecipientIds = mentionRecipientIds.filter(
      (recipientId) => !previousMentionIds.has(recipientId),
    );

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: dto.assigneeId },
        },
      });

      if (!membership) {
        throw new BadRequestException('Исполнитель должен быть участником пространства');
      }
    }

    if (dto.recurrenceOriginColumnId) {
      await this.assertColumnInWorkspace(workspaceId, dto.recurrenceOriginColumnId);
    }

    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findFirst({
        where: { id: dto.sprintId, workspaceId },
        select: { id: true },
      });
      if (!sprint) throw new BadRequestException('Спринт не найден в этом пространстве');
    }

    const nextIsEpic = dto.isEpic ?? task.isEpic;
    if (nextIsEpic && dto.epicId) {
      throw new BadRequestException('Эпик не может входить в другой эпик');
    }
    if (dto.epicId) {
      if (dto.epicId === taskId) {
        throw new BadRequestException('Задача не может быть эпиком самой себе');
      }
      const epic = await this.prisma.task.findFirst({
        where: {
          id: dto.epicId,
          isEpic: true,
          deletedAt: null,
          column: { board: { workspaceId } },
        },
        select: { id: true },
      });
      if (!epic) throw new BadRequestException('Эпик не найден');
    }

    const updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const saved = await tx.task.update({
        where: { id: task.id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(descriptionUpdate
            ? {
                description: descriptionUpdate.description,
                descriptionDoc: descriptionUpdate.descriptionDoc,
              }
            : {}),
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
                dueReminderSentAt: null,
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
          ...(dto.sprintId !== undefined ? { sprintId: dto.sprintId } : {}),
          ...(dto.isEpic !== undefined ? { isEpic: dto.isEpic } : {}),
          ...(dto.isEpic === true
            ? { epicId: null }
            : dto.epicId !== undefined
              ? { epicId: dto.epicId }
              : {}),
        },
        include: taskWithAssignee,
      });

      if (descriptionUpdate !== undefined) {
        await this.mentionsService.notify(
          tx,
          {
            workspaceId,
            actorId: userId,
            taskId,
            sourceType: MentionSourceType.TASK_DESCRIPTION,
            preview: mentionPreview ?? saved.title,
          },
          newRecipientIds,
        );
      }

      return saved;
    });

    if (dto.assigneeId !== undefined && dto.assigneeId !== task.assigneeId) {
      const column = await this.prisma.boardColumn.findFirst({
        where: { id: updated.columnId },
        select: { boardId: true },
      });
      if (column) {
        this.eventEmitter.emit(DomainEvents.TASK_ASSIGNED, {
          workspaceId,
          boardId: column.boardId,
          taskId,
          assigneeId: dto.assigneeId,
          actorId: userId,
        });
      }
    }

    this.eventEmitter.emit(DomainEvents.TASK_CHANGED, {
      workspaceId,
      taskId,
    });

    return this.toTask(updated);
  }

  async bulkUpdate(workspaceId: string, userId: string, dto: BulkUpdateTasksDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const hasAssignee = dto.assigneeId !== undefined;
    const hasPriority = dto.priority !== undefined;
    const hasSprint = dto.sprintId !== undefined;
    const hasColumn = dto.columnId !== undefined;
    if (!hasAssignee && !hasPriority && !hasSprint && !hasColumn) {
      throw new BadRequestException('Укажите хотя бы одно поле для массового изменения');
    }

    const taskIds = [...new Set(dto.taskIds)];
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: {
        id: true,
        columnId: true,
        position: true,
        assigneeId: true,
        completedAt: true,
        column: { select: { boardId: true, position: true } },
      },
    });

    if (tasks.length !== taskIds.length) {
      throw new BadRequestException('Некоторые задачи не найдены в этом пространстве');
    }

    if (hasAssignee && dto.assigneeId !== null) {
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: dto.assigneeId! },
        },
      });
      if (!membership) {
        throw new BadRequestException('Исполнитель должен быть участником пространства');
      }
    }

    if (hasSprint && dto.sprintId !== null) {
      const sprint = await this.prisma.sprint.findFirst({
        where: { id: dto.sprintId!, workspaceId },
        select: { id: true },
      });
      if (!sprint) throw new BadRequestException('Спринт не найден в этом пространстве');
    }

    let targetColumn: {
      id: string;
      boardId: string;
      name: string;
      position: number;
    } | null = null;
    let boardColumns: Array<{ id: string; name: string; position: number }> = [];
    let targetIsDone = false;

    if (hasColumn) {
      const column = await this.prisma.boardColumn.findFirst({
        where: { id: dto.columnId!, board: { workspaceId } },
        select: { id: true, boardId: true, name: true, position: true },
      });
      if (!column) throw new NotFoundException('Колонка не найдена');

      const boardId = column.boardId;
      if (tasks.some((task) => task.column.boardId !== boardId)) {
        throw new BadRequestException('Нельзя переносить задачи с разных досок');
      }

      boardColumns = await this.prisma.boardColumn.findMany({
        where: { boardId },
        orderBy: { position: 'asc' },
        select: { id: true, name: true, position: true },
      });
      targetColumn = column;
      targetIsDone = isDoneColumn(column, boardColumns);
    }

    const orderedForMove = [...tasks].sort((a, b) => {
      if (a.column.position !== b.column.position) {
        return a.column.position - b.column.position;
      }
      return a.position - b.position;
    });

    let bulkMoveBasePosition = 0;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (hasColumn && targetColumn) {
        for (const task of orderedForMove) {
          const currentColumn = boardColumns.find((column) => column.id === task.columnId);
          const movingToDone =
            targetIsDone && Boolean(currentColumn) && !isDoneColumn(currentColumn!, boardColumns);
          if (movingToDone) {
            await tx.$executeRaw`SELECT id FROM tasks WHERE id = ${task.id} FOR UPDATE`;
            await this.taskRelationsService.assertCanComplete(task.id, tx);
            await this.taskChecklistService.assertDoDSatisfied(task.id, tx);
          }
        }

        const selectedSet = new Set(taskIds);
        const sourceColumnIds = [
          ...new Set(
            tasks.filter((task) => task.columnId !== targetColumn.id).map((task) => task.columnId),
          ),
        ];

        for (const columnId of sourceColumnIds) {
          const staying = await tx.task.findMany({
            where: {
              columnId,
              deletedAt: null,
              id: { notIn: [...selectedSet] },
            },
            orderBy: { position: 'asc' },
            select: { id: true },
          });
          await Promise.all(
            staying.map((item, index) =>
              tx.task.update({ where: { id: item.id }, data: { position: index } }),
            ),
          );
        }

        const targetStaying = await tx.task.findMany({
          where: {
            columnId: targetColumn.id,
            deletedAt: null,
            id: { notIn: [...selectedSet] },
          },
          orderBy: { position: 'asc' },
          select: { id: true },
        });
        await Promise.all(
          targetStaying.map((item, index) =>
            tx.task.update({ where: { id: item.id }, data: { position: index } }),
          ),
        );

        const basePosition = targetStaying.length;
        bulkMoveBasePosition = basePosition;
        const now = new Date();
        await Promise.all(
          orderedForMove.map((task, index) =>
            tx.task.update({
              where: { id: task.id },
              data: {
                columnId: targetColumn!.id,
                position: basePosition + index,
                ...(targetIsDone ? { overdueDays: 0 } : {}),
                ...(targetIsDone && !task.completedAt ? { completedAt: now } : {}),
              },
            }),
          ),
        );
      }

      if (hasAssignee || hasPriority || hasSprint) {
        await tx.task.updateMany({
          where: { id: { in: taskIds } },
          data: {
            ...(hasAssignee ? { assigneeId: dto.assigneeId ?? null } : {}),
            ...(hasPriority ? { priority: dto.priority ?? null } : {}),
            ...(hasSprint ? { sprintId: dto.sprintId ?? null } : {}),
          },
        });
      }
    });

    if (hasColumn && targetColumn) {
      for (const [index, task] of orderedForMove.entries()) {
        this.eventEmitter.emit(DomainEvents.TASK_MOVED, {
          workspaceId,
          boardId: targetColumn.boardId,
          taskId: task.id,
          columnId: dto.columnId!,
          position: bulkMoveBasePosition + index,
          actorId: userId,
        });
      }

      if (targetIsDone) {
        const movedIntoDone = orderedForMove.filter((task) => {
          const currentColumn = boardColumns.find((column) => column.id === task.columnId);
          return Boolean(currentColumn) && !isDoneColumn(currentColumn!, boardColumns);
        });
        if (movedIntoDone.length > 0) {
          const recurring = await this.prisma.task.findMany({
            where: {
              id: { in: movedIntoDone.map((task) => task.id) },
              recurrenceRule: { not: TaskRecurrenceRule.NONE },
            },
          });
          for (const task of recurring) {
            await this.handleRecurrenceCompletion(workspaceId, task, boardColumns);
          }
        }
      }
    }

    if (hasAssignee) {
      for (const task of tasks) {
        this.eventEmitter.emit(DomainEvents.TASK_ASSIGNED, {
          workspaceId,
          boardId: task.column.boardId,
          taskId: task.id,
          assigneeId: dto.assigneeId ?? null,
          actorId: userId,
        });
      }
    }

    return { updated: taskIds.length, taskIds };
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
      throw new NotFoundException('Колонка не найдена');
    }

    const sourceColumn = await this.prisma.boardColumn.findFirst({
      where: { id: task.columnId, board: { workspaceId } },
      select: { id: true, boardId: true },
    });

    if (!sourceColumn) {
      throw new NotFoundException('Колонка не найдена');
    }

    if (sourceColumn.boardId !== targetColumn.boardId) {
      throw new BadRequestException('Нельзя переносить задачу на другую доску');
    }

    const board = await this.prisma.board.findFirstOrThrow({
      where: { id: targetColumn.boardId, workspaceId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });

    const currentColumn = board.columns.find((column) => column.id === task.columnId);
    const targetIsDone = isDoneColumn(targetColumn, board.columns);
    const movingToDone =
      targetIsDone && Boolean(currentColumn) && !isDoneColumn(currentColumn!, board.columns);
    const executableAutomations = await this.filterExecutableAutomations(
      workspaceId,
      targetColumn.automations,
    );
    const completionAttempt =
      movingToDone ||
      executableAutomations.some(
        (automation) => automation.action === ColumnAutomationAction.COMPLETE_TASK,
      );

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (task.columnId === dto.columnId) {
        await this.reorderWithinColumn(tx, task.columnId, taskId, dto.position);
        return;
      }

      if (completionAttempt) {
        await tx.$executeRaw`SELECT id FROM tasks WHERE id = ${taskId} FOR UPDATE`;
        await this.taskRelationsService.assertCanComplete(taskId, tx);
        await this.taskChecklistService.assertDoDSatisfied(taskId, tx);
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
          ...(targetIsDone ? { overdueDays: 0 } : {}),
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

    this.eventEmitter.emit(DomainEvents.TASK_MOVED, {
      workspaceId,
      boardId: targetColumn.boardId,
      taskId,
      columnId: dto.columnId,
      position: dto.position,
      actorId: userId,
    });

    if (task.columnId !== dto.columnId) {
      const columnName = targetColumn.name;
      await this.watchersService.notifyWatchers({
        workspaceId,
        taskId,
        actorId: userId,
        preview: `Статус → ${columnName}`,
      });
    }

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
      descriptionDoc?: Prisma.JsonValue | null;
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
            descriptionDoc:
              task.descriptionDoc == null
                ? Prisma.JsonNull
                : (task.descriptionDoc as Prisma.InputJsonValue),
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

    this.eventEmitter.emit(DomainEvents.TASK_SOFT_DELETED, {
      workspaceId,
      taskId,
    });

    return { success: true };
  }

  async applyTemplate(workspaceId: string, taskId: string, userId: string, templateId: string) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);
    const template = await this.taskTemplatesService.getForApply(workspaceId, templateId);
    const defaults = this.taskTemplatesService.taskFieldDefaults(template);
    const fieldPatch = this.taskTemplatesService.fillEmptyTaskFields(task, defaults);

    let descriptionPatch:
      | {
          description: string | null;
          descriptionDoc: Prisma.InputJsonValue | typeof Prisma.JsonNull;
          recipientIds: string[];
        }
      | undefined;

    if (fieldPatch.description) {
      const prepared = await this.mentionsService.prepare(
        workspaceId,
        userId,
        fieldPatch.description,
      );
      descriptionPatch = {
        description: prepared.text,
        descriptionDoc: prepared.text
          ? (descriptionDocFromPlain(prepared.text) as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        recipientIds: prepared.recipientIds,
      };
    }

    const updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const next = await tx.task.update({
        where: { id: taskId },
        data: {
          ...(fieldPatch.title !== undefined ? { title: fieldPatch.title } : {}),
          ...(descriptionPatch
            ? {
                description: descriptionPatch.description,
                descriptionDoc: descriptionPatch.descriptionDoc,
              }
            : {}),
          ...(fieldPatch.priority !== undefined ? { priority: fieldPatch.priority } : {}),
          ...(fieldPatch.complexity !== undefined ? { complexity: fieldPatch.complexity } : {}),
          ...(fieldPatch.timeEstimateMinutes !== undefined
            ? { timeEstimateMinutes: fieldPatch.timeEstimateMinutes }
            : {}),
        },
        include: taskWithAssignee,
      });

      await this.taskTemplatesService.applyInTransaction(tx, workspaceId, taskId, template);

      if (descriptionPatch?.description) {
        await this.mentionsService.notify(
          tx,
          {
            workspaceId,
            actorId: userId,
            taskId,
            sourceType: MentionSourceType.TASK_DESCRIPTION,
            preview: descriptionPatch.description,
          },
          descriptionPatch.recipientIds,
        );
      }

      return next;
    });

    this.eventEmitter.emit(DomainEvents.TASK_CHANGED, {
      workspaceId,
      taskId,
    });

    return this.toTask(updated);
  }

  async duplicate(workspaceId: string, taskId: string, userId: string) {
    const source = await this.assertTaskInWorkspace(workspaceId, taskId, userId);
    await this.boardsService.getBoardForWorkspace(workspaceId);

    const created = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lastTask = await tx.task.findFirst({
        where: { columnId: source.columnId, deletedAt: null },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      const position = (lastTask?.position ?? -1) + 1;

      const copy = await tx.task.create({
        data: {
          columnId: source.columnId,
          title: `${source.title} (копия)`.slice(0, 200),
          description: source.description,
          descriptionDoc:
            source.descriptionDoc === null
              ? Prisma.JsonNull
              : (source.descriptionDoc as Prisma.InputJsonValue),
          priority: source.priority,
          complexity: source.complexity,
          timeEstimateMinutes: source.timeEstimateMinutes,
          actualMinutes: null,
          dueDate: source.dueDate,
          assigneeId: source.assigneeId,
          position,
          recurrenceRule: source.recurrenceRule,
          recurrenceAction: source.recurrenceAction,
          recurrenceWeekdays: source.recurrenceWeekdays,
          recurrenceOriginColumnId: source.recurrenceOriginColumnId,
          overdueDays: 0,
          timerStartedAt: null,
          completedAt: null,
        },
        include: {
          ...taskWithAssignee,
          customFieldValues: { select: { fieldId: true, value: true } },
          taskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          subtasks: {
            orderBy: { position: 'asc' },
            select: { id: true, title: true, completed: true, position: true },
          },
        },
      });

      const [tags, subtasks, checklistItems, customFields] = await Promise.all([
        tx.taskTag.findMany({ where: { taskId: source.id }, select: { tagId: true } }),
        tx.subtask.findMany({
          where: { taskId: source.id },
          orderBy: { position: 'asc' },
          select: { title: true, position: true },
        }),
        tx.taskChecklistItem.findMany({
          where: { taskId: source.id },
          orderBy: { position: 'asc' },
          select: { text: true, required: true, position: true, sourceTemplateId: true },
        }),
        tx.customFieldValue.findMany({
          where: { taskId: source.id },
          select: { fieldId: true, value: true },
        }),
      ]);

      if (tags.length > 0) {
        await tx.taskTag.createMany({
          data: tags.map((entry) => ({ taskId: copy.id, tagId: entry.tagId })),
        });
      }
      if (subtasks.length > 0) {
        await tx.subtask.createMany({
          data: subtasks.map((entry) => ({
            taskId: copy.id,
            title: entry.title,
            completed: false,
            position: entry.position,
          })),
        });
      }
      if (checklistItems.length > 0) {
        await tx.taskChecklistItem.createMany({
          data: checklistItems.map((entry) => ({
            taskId: copy.id,
            text: entry.text,
            required: entry.required,
            completed: false,
            position: entry.position,
            sourceTemplateId: entry.sourceTemplateId,
          })),
        });
      }
      if (customFields.length > 0) {
        await tx.customFieldValue.createMany({
          data: customFields.map((entry) => ({
            taskId: copy.id,
            fieldId: entry.fieldId,
            value: entry.value as Prisma.InputJsonValue,
          })),
        });
      }

      return tx.task.findFirst({
        where: { id: copy.id },
        include: {
          ...taskWithAssignee,
          customFieldValues: { select: { fieldId: true, value: true } },
          taskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          subtasks: {
            orderBy: { position: 'asc' },
            select: { id: true, title: true, completed: true, position: true },
          },
        },
      });
    });

    if (!created) {
      throw new NotFoundException('Задача не найдена');
    }

    this.eventEmitter.emit(DomainEvents.TASK_CHANGED, {
      workspaceId,
      taskId: created.id,
    });

    return this.boardsService.serializeTask(created);
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
      throw new NotFoundException('Задача не найдена');
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
      throw new BadRequestException('Колонка должна принадлежать этому пространству');
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
    await tx.task.updateMany({
      where: { columnId, deletedAt: null, position: { gt: removedPosition } },
      data: { position: { decrement: 1 } },
    });
  }

  private async makeSpace(tx: Prisma.TransactionClient, columnId: string, position: number) {
    await tx.task.updateMany({
      where: { columnId, deletedAt: null, position: { gte: position } },
      data: { position: { increment: 1 } },
    });
  }

  private toTask(task: {
    id: string;
    title: string;
    description: string | null;
    descriptionDoc?: import('@prisma/client').Prisma.JsonValue | null;
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
