import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  AllTasksDueFilter,
  AllTasksSort,
  AllTasksStatus,
  ListAllTasksQueryDto,
  SortOrder,
} from './dto/list-all-tasks-query.dto';

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
    const where = this.buildWhere(workspaceId, query);
    const orderBy = this.buildOrderBy(query);

    const [total, tasks, boards] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          customFieldValues: {
            select: { fieldId: true, value: true },
          },
          column: {
            select: {
              id: true,
              name: true,
              board: { select: { id: true, name: true } },
            },
          },
        },
      }),
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
      boards,
    };
  }

  private buildWhere(workspaceId: string, query: ListAllTasksQueryDto): Prisma.TaskWhereInput {
    const search = query.search?.trim();
    const board = {
      workspaceId,
      ...(query.boardId ? { id: query.boardId } : {}),
    };

    return {
      deletedAt: null,
      column: { board },
      ...(query.columnId ? { columnId: query.columnId } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.status === AllTasksStatus.OPEN ? { completedAt: null } : {}),
      ...(query.status === AllTasksStatus.COMPLETED ? { completedAt: { not: null } } : {}),
      ...(query.due === AllTasksDueFilter.OVERDUE
        ? {
            dueDate: { lt: new Date() },
            ...(query.status !== AllTasksStatus.COMPLETED ? { completedAt: null } : {}),
          }
        : {}),
      ...(query.due === AllTasksDueFilter.UPCOMING ? { dueDate: { gte: new Date() } } : {}),
      ...(query.due === AllTasksDueFilter.NO_DUE ? { dueDate: null } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
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
