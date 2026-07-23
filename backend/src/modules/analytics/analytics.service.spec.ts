import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.service';

function makePrisma() {
  return {
    board: { findMany: vi.fn() },
    task: { findMany: vi.fn(), count: vi.fn() },
  };
}

describe('AnalyticsService.stuckTasks', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new AnalyticsService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
    );

    prisma.board.findMany.mockResolvedValue([
      {
        id: 'board-1',
        name: 'Основная',
        columns: [
          { id: 'col-todo', name: 'К работе', position: 0 },
          { id: 'col-doing', name: 'В работе', position: 1 },
          { id: 'col-done', name: 'Готово', position: 2 },
        ],
      },
    ]);
  });

  it('returns open tasks not updated within threshold and excludes done column', async () => {
    const now = Date.now();
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Застряла',
        columnId: 'col-doing',
        priority: 'HIGH',
        updatedAt: new Date(now - 8 * 86_400_000),
        createdAt: new Date(now - 20 * 86_400_000),
        dueDate: null,
        overdueDays: 0,
        assignee: { id: 'u1', name: 'Анна' },
      },
    ]);

    const result = await service.stuckTasks('workspace-1', 'user-1', { days: 5 });

    expect(result.days).toBe(5);
    expect(result.count).toBe(1);
    expect(result.tasks[0]).toMatchObject({
      id: 'task-1',
      title: 'Застряла',
      columnName: 'В работе',
      boardName: 'Основная',
      assignee: { id: 'u1', name: 'Анна' },
    });
    expect(result.tasks[0].daysSinceUpdate).toBeGreaterThanOrEqual(8);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completedAt: null,
          columnId: { notIn: ['col-done'] },
          updatedAt: expect.any(Object),
        }),
      }),
    );
  });

  it('applies assignee filter', async () => {
    prisma.task.findMany.mockResolvedValue([]);

    await service.stuckTasks('workspace-1', 'user-1', {
      days: 3,
      assigneeId: 'user-anna',
    });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assigneeId: 'user-anna',
        }),
      }),
    );
  });
});

describe('AnalyticsService.summary', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new AnalyticsService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
    );
  });

  it('uses count for throughput and a capped sample for cycle time', async () => {
    prisma.task.count.mockResolvedValueOnce(42).mockResolvedValueOnce(3);
    prisma.task.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
        completedAt: new Date('2026-07-02T12:00:00.000Z'),
      },
    ]);

    const result = await service.summary('workspace-1', 'user-1', {});

    expect(result.throughput).toBe(42);
    expect(result.overdueCount).toBe(3);
    expect(prisma.task.count).toHaveBeenCalledTimes(2);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2000,
        select: { createdAt: true, completedAt: true },
      }),
    );
  });
});
