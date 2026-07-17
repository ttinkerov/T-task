import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskRelationType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { isDoneColumn } from './utils/recurrence.util';
import { CreateTaskRelationDto, TaskRelationViewType } from './dto/create-task-relation.dto';

const relationTaskInclude = {
  select: {
    id: true,
    title: true,
    columnId: true,
    completedAt: true,
    column: {
      select: {
        name: true,
        position: true,
        board: {
          select: {
            columns: { select: { position: true } },
          },
        },
      },
    },
  },
} as const;
const MAX_BLOCKING_RELATIONS_PER_WORKSPACE = 5_000;

@Injectable()
export class TaskRelationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async list(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.getTasksInWorkspace(workspaceId, [taskId]);

    const relations = await this.prisma.taskRelation.findMany({
      where: {
        OR: [{ sourceTaskId: taskId }, { targetTaskId: taskId }],
        sourceTask: { deletedAt: null },
        targetTask: { deletedAt: null },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: {
        sourceTask: relationTaskInclude,
        targetTask: relationTaskInclude,
      },
    });

    return relations.map((relation) => this.serializeForTask(relation, taskId));
  }

  async create(workspaceId: string, taskId: string, userId: string, dto: CreateTaskRelationDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    if (taskId === dto.relatedTaskId) {
      throw new BadRequestException('Задачу нельзя связать с самой собой');
    }

    const tasks = await this.getTasksInWorkspace(workspaceId, [taskId, dto.relatedTaskId]);
    const currentTask = tasks.find((task) => task.id === taskId)!;
    const relatedTask = tasks.find((task) => task.id === dto.relatedTaskId)!;
    const normalized = this.normalize(taskId, dto.relatedTaskId, dto.type);

    try {
      const relation = await this.prisma.$transaction(async (tx) => {
        // Serialize relation edits inside a workspace so concurrent edges cannot create a cycle.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${workspaceId}))`;
        const duplicate = await tx.taskRelation.findFirst({
          where: { pairKey: normalized.pairKey },
          select: { id: true, type: true },
        });
        if (duplicate) {
          throw new ConflictException('Между этими задачами уже есть связь');
        }

        if (normalized.type === TaskRelationType.BLOCKS) {
          await tx.$executeRaw`SELECT id FROM tasks WHERE id = ${normalized.targetTaskId} FOR UPDATE`;
          const targetTask = await tx.task.findUnique({
            where: { id: normalized.targetTaskId },
            select: relationTaskInclude.select,
          });
          if (!targetTask || this.isTaskCompleted(targetTask)) {
            throw new ConflictException('Нельзя заблокировать уже выполненную задачу');
          }
          await this.assertNoDependencyCycle(
            tx,
            workspaceId,
            normalized.sourceTaskId,
            normalized.targetTaskId,
          );
        }

        return tx.taskRelation.create({ data: normalized });
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.TASK_RELATION_CREATED,
        entityType: ActivityEntityType.TASK,
        entityId: currentTask.id,
        entityName: currentTask.title,
        metadata: {
          relationType: dto.type,
          relatedTaskId: relatedTask.id,
          relatedTaskName: relatedTask.title,
        },
      });
      return {
        id: relation.id,
        type: dto.type,
        task: {
          id: relatedTask.id,
          title: relatedTask.title,
          columnId: relatedTask.columnId,
          columnName: relatedTask.column.name,
          completed: this.isTaskCompleted(relatedTask),
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Такая связь уже существует');
      }
      throw error;
    }
  }

  async remove(workspaceId: string, taskId: string, relationId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const [currentTask] = await this.getTasksInWorkspace(workspaceId, [taskId]);
    const relation = await this.prisma.taskRelation.findFirst({
      where: {
        id: relationId,
        OR: [{ sourceTaskId: taskId }, { targetTaskId: taskId }],
        sourceTask: { deletedAt: null },
        targetTask: { deletedAt: null },
      },
      include: {
        sourceTask: { select: { title: true } },
        targetTask: { select: { title: true } },
      },
    });

    if (!relation) {
      throw new NotFoundException('Связь задач не найдена');
    }

    const relatedTaskId =
      relation.sourceTaskId === taskId ? relation.targetTaskId : relation.sourceTaskId;
    const relatedTaskName =
      relation.sourceTaskId === taskId ? relation.targetTask.title : relation.sourceTask.title;
    const relationType = this.typeForTask(relation, taskId);
    const deleted = await this.prisma.taskRelation.deleteMany({ where: { id: relation.id } });
    if (deleted.count === 0) {
      throw new NotFoundException('Связь задач не найдена');
    }
    await this.activityService.record({
      workspaceId,
      actorId: userId,
      action: ActivityAction.TASK_RELATION_DELETED,
      entityType: ActivityEntityType.TASK,
      entityId: currentTask.id,
      entityName: currentTask.title,
      metadata: { relationType, relatedTaskId, relatedTaskName },
    });

    return { success: true };
  }

  async assertCanComplete(
    taskId: string,
    client: Pick<Prisma.TransactionClient, 'taskRelation'> | PrismaService = this.prisma,
  ): Promise<void> {
    const blockers = await client.taskRelation.findMany({
      where: {
        type: TaskRelationType.BLOCKS,
        targetTaskId: taskId,
        sourceTask: { deletedAt: null },
      },
      select: {
        sourceTask: relationTaskInclude,
      },
      take: 100,
    });
    const unfinished = blockers
      .map((relation) => relation.sourceTask)
      .filter((task) => !this.isTaskCompleted(task));

    if (unfinished.length > 0) {
      const names = unfinished
        .slice(0, 3)
        .map((task) => task.title)
        .join(', ');
      const suffix = unfinished.length > 3 ? ` и ещё ${unfinished.length - 3}` : '';
      throw new ConflictException(`Сначала завершите блокирующие задачи: ${names}${suffix}`);
    }
  }

  private async getTasksInWorkspace(workspaceId: string, taskIds: string[]) {
    const uniqueIds = [...new Set(taskIds)];
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: uniqueIds },
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: relationTaskInclude.select,
    });

    if (tasks.length !== uniqueIds.length) {
      throw new NotFoundException('Одна из задач не найдена');
    }

    return tasks;
  }

  private normalize(
    taskId: string,
    relatedTaskId: string,
    type: TaskRelationViewType,
  ): {
    sourceTaskId: string;
    targetTaskId: string;
    pairKey: string;
    type: TaskRelationType;
  } {
    const pairKey = [taskId, relatedTaskId].sort().join(':');
    if (type === 'WAITING_FOR') {
      return {
        sourceTaskId: relatedTaskId,
        targetTaskId: taskId,
        pairKey,
        type: TaskRelationType.BLOCKS,
      };
    }

    if (type === 'RELATES_TO') {
      const [sourceTaskId, targetTaskId] = [taskId, relatedTaskId].sort();
      return {
        sourceTaskId,
        targetTaskId,
        pairKey,
        type: TaskRelationType.RELATES_TO,
      };
    }

    return {
      sourceTaskId: taskId,
      targetTaskId: relatedTaskId,
      pairKey,
      type: TaskRelationType.BLOCKS,
    };
  }

  private async assertNoDependencyCycle(
    client: Pick<Prisma.TransactionClient, 'taskRelation'>,
    workspaceId: string,
    sourceTaskId: string,
    targetTaskId: string,
  ): Promise<void> {
    const relations = await client.taskRelation.findMany({
      where: {
        type: TaskRelationType.BLOCKS,
        sourceTask: { deletedAt: null, column: { board: { workspaceId } } },
        targetTask: { deletedAt: null, column: { board: { workspaceId } } },
      },
      select: { sourceTaskId: true, targetTaskId: true },
      take: MAX_BLOCKING_RELATIONS_PER_WORKSPACE + 1,
    });
    if (relations.length > MAX_BLOCKING_RELATIONS_PER_WORKSPACE) {
      throw new ConflictException(
        'В рабочем пространстве слишком много зависимостей для добавления новой',
      );
    }
    const adjacency = new Map<string, string[]>();

    for (const relation of relations) {
      const targets = adjacency.get(relation.sourceTaskId) ?? [];
      adjacency.set(relation.sourceTaskId, [...targets, relation.targetTaskId]);
    }

    const visited = new Set<string>();
    const pending = [targetTaskId];
    while (pending.length > 0) {
      const current = pending.pop()!;
      if (current === sourceTaskId) {
        throw new ConflictException('Циклическая зависимость задач недопустима');
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      pending.push(...(adjacency.get(current) ?? []));
    }
  }

  private serializeForTask(
    relation: {
      id: string;
      type: TaskRelationType;
      sourceTaskId: string;
      targetTaskId: string;
      sourceTask: Parameters<TaskRelationsService['isTaskCompleted']>[0] & {
        id: string;
        title: string;
        columnId: string;
        column: { name: string };
      };
      targetTask: Parameters<TaskRelationsService['isTaskCompleted']>[0] & {
        id: string;
        title: string;
        columnId: string;
        column: { name: string };
      };
    },
    taskId: string,
  ) {
    const task = relation.sourceTaskId === taskId ? relation.targetTask : relation.sourceTask;
    return {
      id: relation.id,
      type: this.typeForTask(relation, taskId),
      task: {
        id: task.id,
        title: task.title,
        columnId: task.columnId,
        columnName: task.column.name,
        completed: this.isTaskCompleted(task),
      },
    };
  }

  private typeForTask(
    relation: {
      type: TaskRelationType;
      sourceTaskId: string;
    },
    taskId: string,
  ): TaskRelationViewType {
    if (relation.type === TaskRelationType.RELATES_TO) {
      return 'RELATES_TO';
    }
    return relation.sourceTaskId === taskId ? 'BLOCKS' : 'WAITING_FOR';
  }

  private isTaskCompleted(task: {
    completedAt: Date | null;
    column: {
      name: string;
      position: number;
      board: { columns: Array<{ position: number }> };
    };
  }): boolean {
    return Boolean(task.completedAt || isDoneColumn(task.column, task.column.board.columns));
  }
}
