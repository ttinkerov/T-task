import { TaskPriority } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AllTasksDueFilter,
  AllTasksSort,
  AllTasksStatus,
  SortOrder,
} from './dto/list-all-tasks-query.dto';
import { AllTasksService } from './all-tasks.service';

function makePrisma() {
  return {
    task: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    board: {
      findMany: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
    },
  };
}

describe('AllTasksService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AllTasksService;

  beforeEach(() => {
    prisma = makePrisma();
    prisma.task.count.mockResolvedValue(1);
    prisma.board.findMany.mockResolvedValue([
      {
        id: 'board-1',
        name: 'Продукт',
        columns: [{ id: 'column-1', name: 'В работе' }],
      },
    ]);
    prisma.tag.findMany.mockResolvedValue([]);
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Запуск',
        description: null,
        priority: TaskPriority.HIGH,
        complexity: null,
        timeEstimateMinutes: null,
        actualMinutes: null,
        dueDate: new Date('2026-07-20T12:00:00.000Z'),
        assigneeId: 'user-2',
        position: 0,
        columnId: 'column-1',
        recurrenceRule: 'NONE',
        recurrenceAction: 'DUPLICATE',
        recurrenceWeekdays: [],
        recurrenceOriginColumnId: null,
        overdueDays: 0,
        timerStartedAt: null,
        completedAt: null,
        createdAt: new Date('2026-07-17T00:00:00.000Z'),
        assignee: { id: 'user-2', name: 'Анна', email: 'a@example.com', avatarUrl: null },
        customFieldValues: [],
        column: {
          id: 'column-1',
          name: 'В работе',
          board: { id: 'board-1', name: 'Продукт' },
        },
      },
    ]);
    service = new AllTasksService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
      {
        serializeTask: vi.fn((task) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate?.toISOString?.() ?? task.dueDate ?? null,
          completedAt: task.completedAt?.toISOString?.() ?? task.completedAt ?? null,
        })),
      } as never,
    );
  });

  it('returns a paginated tenant-scoped task envelope', async () => {
    const result = await service.list('workspace-1', 'user-1', {
      page: 2,
      limit: 20,
      sortBy: AllTasksSort.DUE_DATE,
      sortOrder: SortOrder.ASC,
    });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          column: { board: { workspaceId: 'workspace-1' } },
        }),
        skip: 20,
        take: 20,
        orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
      }),
    );
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: 'task-1',
          board: { id: 'board-1', name: 'Продукт' },
          column: { id: 'column-1', name: 'В работе' },
        }),
      ],
      total: 1,
      page: 2,
      limit: 20,
      totalPages: 1,
    });
  });

  it('does not load boards/tags metadata with the task list', async () => {
    await service.list('workspace-1', 'user-1', {
      page: 1,
      limit: 20,
      sortBy: AllTasksSort.CREATED_AT,
      sortOrder: SortOrder.DESC,
    });
    expect(prisma.board.findMany).not.toHaveBeenCalled();
    expect(prisma.tag.findMany).not.toHaveBeenCalled();
  });

  it('returns boards and tags via getFilterMeta', async () => {
    const result = await service.getFilterMeta('workspace-1', 'user-1');
    expect(prisma.board.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: 'workspace-1' } }),
    );
    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: 'workspace-1' } }),
    );
    expect(result).toEqual({
      boards: [
        {
          id: 'board-1',
          name: 'Продукт',
          columns: [{ id: 'column-1', name: 'В работе' }],
        },
      ],
      tags: [],
    });
  });

  it('applies search, assignee, priority, completion, board, and overdue filters', async () => {
    await service.list('workspace-1', 'user-1', {
      page: 1,
      limit: 50,
      search: 'релиз',
      assigneeId: 'user-2',
      priority: TaskPriority.URGENT,
      status: AllTasksStatus.OPEN,
      due: AllTasksDueFilter.OVERDUE,
      boardId: 'board-1',
      columnId: 'column-1',
      sortBy: AllTasksSort.CREATED_AT,
      sortOrder: SortOrder.DESC,
    });

    expect(prisma.task.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        assigneeId: 'user-2',
        priority: TaskPriority.URGENT,
        completedAt: null,
        dueDate: { lt: expect.any(Date) },
        columnId: 'column-1',
        column: { board: { workspaceId: 'workspace-1', id: 'board-1' } },
        title: { contains: 'релиз', mode: 'insensitive' },
      }),
    });
  });

  it('returns completed tasks with past due dates when overdue and completed are both selected', async () => {
    await service.list('workspace-1', 'user-1', {
      page: 1,
      limit: 50,
      status: AllTasksStatus.COMPLETED,
      due: AllTasksDueFilter.OVERDUE,
      sortBy: AllTasksSort.CREATED_AT,
      sortOrder: SortOrder.DESC,
    });

    expect(prisma.task.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        completedAt: { not: null },
        dueDate: { lt: expect.any(Date) },
      }),
    });
    expect(prisma.task.count).toHaveBeenCalledWith({
      where: expect.not.objectContaining({
        AND: [{ completedAt: null }],
      }),
    });
  });

  it('loads assigned and watching in one my-tasks response with buckets', async () => {
    const now = new Date('2026-07-25T12:00:00.000Z');
    prisma.task.findMany
      .mockResolvedValueOnce([
        {
          id: 'overdue',
          title: 'Late',
          dueDate: new Date('2026-07-20T00:00:00.000Z'),
          completedAt: null,
          column: {
            id: 'column-1',
            name: 'В работе',
            board: { id: 'board-1', name: 'Продукт' },
          },
        },
        {
          id: 'soon',
          title: 'Soon',
          dueDate: new Date('2026-07-27T00:00:00.000Z'),
          completedAt: null,
          column: {
            id: 'column-1',
            name: 'В работе',
            board: { id: 'board-1', name: 'Продукт' },
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'soon',
          title: 'Soon',
          dueDate: new Date('2026-07-27T00:00:00.000Z'),
          completedAt: null,
          column: {
            id: 'column-1',
            name: 'В работе',
            board: { id: 'board-1', name: 'Продукт' },
          },
        },
        {
          id: 'watch-only',
          title: 'Watch',
          dueDate: new Date('2026-07-26T00:00:00.000Z'),
          completedAt: null,
          column: {
            id: 'column-1',
            name: 'В работе',
            board: { id: 'board-1', name: 'Продукт' },
          },
        },
      ]);

    const result = await service.listMyTasks('workspace-1', 'user-1', 50, now);

    expect(prisma.task.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.task.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ assigneeId: 'user-1', completedAt: null }),
        take: 50,
      }),
    );
    expect(prisma.task.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          watchers: { some: { userId: 'user-1' } },
          completedAt: null,
        }),
        take: 50,
      }),
    );
    expect(result.overdue.map((task) => task.id)).toEqual(['overdue']);
    expect(result.dueSoon.map((task) => task.id)).toEqual(['soon']);
    expect(result.watching.map((task) => task.id)).toEqual(['watch-only']);
    expect(result.limit).toBe(50);
    expect(result.dueSoonDays).toBe(7);
  });
});
