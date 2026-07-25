import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  AllTasksDueFilter,
  AllTasksSort,
  AllTasksStatus,
  DUE_SOON_DAYS,
  ListAllTasksQueryDto,
  SortOrder,
} from './dto/list-all-tasks-query.dto';
import { MY_TASKS_DUE_SOON_DAYS, partitionMyTasks } from './utils/partition-my-tasks.util';

const MY_TASKS_LIST_INCLUDE = {
  assignee: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  taskTags: {
    include: { tag: { select: { id: true, name: true, color: true } } },
    orderBy: { tag: { name: 'asc' as const } },
  },
  column: {
    select: {
      id: true,
      name: true,
      board: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.TaskInclude;

@Injectable()
export class AllTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly boardsService: BoardsService,
  ) {}

  async list(workspaceId: string, userId: string, query: ListAllTasksQueryDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where = this.buildWhere(workspaceId, userId, query);
    const orderBy = this.buildOrderBy(query);

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: MY_TASKS_LIST_INCLUDE,
      }),
    ]);

    return {
      items: tasks.map((task) => ({
        ...this.boardsService.serializeTask(task),
        board: task.column.board,
        column: { id: task.column.id, name: task.column.name },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFilterMeta(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const [boards, tags] = await Promise.all([
      this.prisma.board.findMany({
        where: { workspaceId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          columns: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.tag.findMany({
        where: { workspaceId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, color: true },
      }),
    ]);

    return { boards, tags };
  }

  async listMyTasks(workspaceId: string, userId: string, limit = 50, now: Date = new Date()) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const take = Math.min(Math.max(limit, 1), 100);
    const openInWorkspace: Prisma.TaskWhereInput = {
      deletedAt: null,
      completedAt: null,
      column: { board: { workspaceId } },
    };
    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [
      { dueDate: { sort: 'asc', nulls: 'last' } },
      { id: 'asc' },
    ];

    const [assignedRows, watchingRows] = await Promise.all([
      this.prisma.task.findMany({
        where: { ...openInWorkspace, assigneeId: userId },
        take,
        orderBy,
        include: MY_TASKS_LIST_INCLUDE,
      }),
      this.prisma.task.findMany({
        where: { ...openInWorkspace, watchers: { some: { userId } } },
        take,
        orderBy,
        include: MY_TASKS_LIST_INCLUDE,
      }),
    ]);

    const serialize = (task: (typeof assignedRows)[number]) => ({
      ...this.boardsService.serializeTask(task),
      board: task.column.board,
      column: { id: task.column.id, name: task.column.name },
    });

    const buckets = partitionMyTasks(assignedRows.map(serialize), watchingRows.map(serialize), now);

    return {
      ...buckets,
      limit: take,
      dueSoonDays: MY_TASKS_DUE_SOON_DAYS,
    };
  }

  private buildWhere(
    workspaceId: string,
    userId: string,
    query: ListAllTasksQueryDto,
  ): Prisma.TaskWhereInput {
    const search = query.search?.trim();
    const board = {
      workspaceId,
      ...(query.boardId ? { id: query.boardId } : {}),
    };
    const now = new Date();
    const dueSoonEnd = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);

    return {
      deletedAt: null,
      column: { board },
      ...(query.columnId ? { columnId: query.columnId } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.watching ? { watchers: { some: { userId } } } : {}),
      ...(query.tagId ? { taskTags: { some: { tagId: query.tagId } } } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.status === AllTasksStatus.OPEN ? { completedAt: null } : {}),
      ...(query.status === AllTasksStatus.COMPLETED ? { completedAt: { not: null } } : {}),
      ...(query.due === AllTasksDueFilter.OVERDUE
        ? {
            dueDate: { lt: now },
            ...(query.status !== AllTasksStatus.COMPLETED ? { completedAt: null } : {}),
          }
        : {}),
      ...(query.due === AllTasksDueFilter.UPCOMING ? { dueDate: { gte: now } } : {}),
      ...(query.due === AllTasksDueFilter.DUE_SOON
        ? {
            dueDate: { gte: now, lte: dueSoonEnd },
            ...(query.status !== AllTasksStatus.COMPLETED ? { completedAt: null } : {}),
          }
        : {}),
      ...(query.due === AllTasksDueFilter.NO_DUE ? { dueDate: null } : {}),
      ...(search
        ? {
            // Title-only: description ILIKE is expensive on large TEXT without an index.
            title: { contains: search, mode: 'insensitive' },
          }
        : {}),
    };
  }

  private buildOrderBy(query: ListAllTasksQueryDto): Prisma.TaskOrderByWithRelationInput[] {
    const direction = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const primary: Prisma.TaskOrderByWithRelationInput =
      query.sortBy === AllTasksSort.DUE_DATE
        ? { dueDate: { sort: direction, nulls: 'last' } }
        : query.sortBy === AllTasksSort.PRIORITY
          ? { priority: { sort: direction, nulls: 'last' } }
          : query.sortBy === AllTasksSort.TITLE
            ? { title: direction }
            : query.sortBy === AllTasksSort.UPDATED_AT
              ? { updatedAt: direction }
              : { createdAt: direction };

    return [primary, { id: 'asc' }];
  }
}
