import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { isDoneColumn } from '../boards/utils/overdue.util';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { StuckTasksQueryDto } from './dto/stuck-tasks-query.dto';

const STUCK_TASKS_LIMIT = 50;
const DEFAULT_STUCK_DAYS = 5;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async summary(workspaceId: string, userId: string, query: AnalyticsQueryDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const taskWhere: Prisma.TaskWhereInput = {
      deletedAt: null,
      column: {
        board: {
          workspaceId,
          ...(query.boardId ? { id: query.boardId } : {}),
        },
      },
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    };

    const [completed, overdueCount, openCycleSamples] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          ...taskWhere,
          completedAt: { gte: from, lte: to },
        },
        select: { createdAt: true, completedAt: true },
      }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          completedAt: null,
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.task.findMany({
        where: {
          ...taskWhere,
          completedAt: { gte: from, lte: to, not: null },
        },
        select: { createdAt: true, completedAt: true },
        take: 2000,
      }),
    ]);

    const cycleHours = openCycleSamples
      .filter((task) => task.completedAt)
      .map((task) => (task.completedAt!.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60))
      .filter((hours) => Number.isFinite(hours) && hours >= 0)
      .sort((a, b) => a - b);

    const avgCycleTimeHours =
      cycleHours.length === 0
        ? 0
        : Math.round((cycleHours.reduce((sum, h) => sum + h, 0) / cycleHours.length) * 10) / 10;

    const medianCycleTimeHours =
      cycleHours.length === 0
        ? 0
        : Math.round(cycleHours[Math.floor(cycleHours.length / 2)] * 10) / 10;

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      throughput: completed.length,
      avgCycleTimeHours,
      medianCycleTimeHours,
      overdueCount,
    };
  }

  async stuckTasks(workspaceId: string, userId: string, query: StuckTasksQueryDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const days = query.days ?? DEFAULT_STUCK_DAYS;
    const asOf = new Date();
    const threshold = new Date(asOf.getTime() - days * 86_400_000);

    const boards = await this.prisma.board.findMany({
      where: {
        workspaceId,
        ...(query.boardId ? { id: query.boardId } : {}),
      },
      select: {
        id: true,
        name: true,
        columns: {
          select: { id: true, name: true, position: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    const doneColumnIds = boards.flatMap((board) =>
      board.columns
        .filter((column) => isDoneColumn(column, board.columns))
        .map((column) => column.id),
    );

    const columnMeta = new Map(
      boards.flatMap((board) =>
        board.columns.map((column) => [
          column.id,
          { name: column.name, boardId: board.id, boardName: board.name },
        ]),
      ),
    );

    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        completedAt: null,
        updatedAt: { lte: threshold },
        ...(doneColumnIds.length > 0 ? { columnId: { notIn: doneColumnIds } } : {}),
        column: {
          board: {
            workspaceId,
            ...(query.boardId ? { id: query.boardId } : {}),
          },
        },
        ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      },
      select: {
        id: true,
        title: true,
        columnId: true,
        priority: true,
        updatedAt: true,
        createdAt: true,
        dueDate: true,
        overdueDays: true,
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'asc' },
      take: STUCK_TASKS_LIMIT,
    });

    const items = tasks.map((task) => {
      const meta = columnMeta.get(task.columnId);
      const daysSinceUpdate = Math.max(
        0,
        Math.floor((asOf.getTime() - task.updatedAt.getTime()) / 86_400_000),
      );
      return {
        id: task.id,
        title: task.title,
        columnId: task.columnId,
        columnName: meta?.name ?? '—',
        boardId: meta?.boardId ?? '',
        boardName: meta?.boardName ?? '—',
        assignee: task.assignee,
        priority: task.priority,
        updatedAt: task.updatedAt.toISOString(),
        createdAt: task.createdAt.toISOString(),
        daysSinceUpdate,
        dueDate: task.dueDate?.toISOString() ?? null,
        overdueDays: task.overdueDays,
      };
    });

    return {
      days,
      asOf: asOf.toISOString(),
      count: items.length,
      truncated: items.length >= STUCK_TASKS_LIMIT,
      tasks: items,
    };
  }
}
