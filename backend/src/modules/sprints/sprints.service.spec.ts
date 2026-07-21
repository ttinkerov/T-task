import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SprintsService } from './sprints.service';

function makePrisma() {
  return {
    sprint: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  };
}

describe('SprintsService velocity', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let workspaces: { getWorkspaceForMember: ReturnType<typeof vi.fn> };
  let service: SprintsService;

  beforeEach(() => {
    prisma = makePrisma();
    workspaces = {
      getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }),
    };
    service = new SprintsService(prisma as never, workspaces as never);
  });

  it('returns empty velocity for a workspace without sprints', async () => {
    prisma.sprint.findMany.mockResolvedValue([]);

    await expect(service.velocity('workspace-1', 'user-1')).resolves.toEqual({
      sprints: [],
      averageVelocity: 0,
    });
    expect(prisma.task.groupBy).not.toHaveBeenCalled();
  });

  it('sums committed and completed points and averages closed sprints only', async () => {
    prisma.sprint.findMany.mockResolvedValue([
      {
        id: 'sprint-2',
        workspaceId: 'workspace-1',
        name: 'Sprint 2',
        startDate: new Date('2026-07-15T00:00:00.000Z'),
        endDate: new Date('2026-07-28T23:59:59.000Z'),
        closedAt: null,
        createdAt: new Date('2026-07-15T00:00:00.000Z'),
        updatedAt: new Date('2026-07-15T00:00:00.000Z'),
      },
      {
        id: 'sprint-1',
        workspaceId: 'workspace-1',
        name: 'Sprint 1',
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-07-14T23:59:59.000Z'),
        closedAt: new Date('2026-07-14T18:00:00.000Z'),
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
        updatedAt: new Date('2026-07-14T18:00:00.000Z'),
      },
    ]);

    prisma.task.groupBy
      .mockResolvedValueOnce([
        { sprintId: 'sprint-1', _sum: { complexity: 13 } },
        { sprintId: 'sprint-2', _sum: { complexity: 8 } },
      ])
      .mockResolvedValueOnce([
        { sprintId: 'sprint-1', _sum: { complexity: 10 } },
        { sprintId: 'sprint-2', _sum: { complexity: 3 } },
      ]);

    const result = await service.velocity('workspace-1', 'user-1');

    expect(result.sprints).toEqual([
      expect.objectContaining({
        sprintId: 'sprint-1',
        name: 'Sprint 1',
        closedAt: '2026-07-14T18:00:00.000Z',
        committedPoints: 13,
        completedPoints: 10,
      }),
      expect.objectContaining({
        sprintId: 'sprint-2',
        name: 'Sprint 2',
        closedAt: null,
        committedPoints: 8,
        completedPoints: 3,
      }),
    ]);
    expect(result.averageVelocity).toBe(10);
  });

  it('treats missing groupBy sums as zero points', async () => {
    prisma.sprint.findMany.mockResolvedValue([
      {
        id: 'sprint-1',
        workspaceId: 'workspace-1',
        name: 'Empty',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-14T23:59:59.000Z'),
        closedAt: new Date('2026-06-14T12:00:00.000Z'),
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-14T12:00:00.000Z'),
      },
    ]);
    prisma.task.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await service.velocity('workspace-1', 'user-1');

    expect(result.sprints[0]).toEqual(
      expect.objectContaining({
        committedPoints: 0,
        completedPoints: 0,
      }),
    );
    expect(result.averageVelocity).toBe(0);
  });
});

describe('SprintsService burndown points', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: SprintsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new SprintsService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
    );
    prisma.sprint.findFirst.mockResolvedValue({
      id: 'sprint-1',
      workspaceId: 'workspace-1',
      name: 'Sprint 1',
      startDate: new Date('2026-07-13T00:00:00.000Z'),
      endDate: new Date('2026-07-15T23:59:59.000Z'),
      closedAt: null,
      createdAt: new Date('2026-07-13T00:00:00.000Z'),
      updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    });
  });

  it('includes totalPoints and remainingPoints on burndown days', async () => {
    prisma.task.findMany.mockResolvedValue([
      {
        id: 't1',
        createdAt: new Date('2026-07-13T08:00:00.000Z'),
        completedAt: new Date('2026-07-14T10:00:00.000Z'),
        complexity: 5,
      },
      {
        id: 't2',
        createdAt: new Date('2026-07-13T09:00:00.000Z'),
        completedAt: null,
        complexity: 3,
      },
      {
        id: 't3',
        createdAt: new Date('2026-07-13T09:30:00.000Z'),
        completedAt: null,
        complexity: null,
      },
    ]);

    const result = await service.burndown('workspace-1', 'sprint-1', 'user-1');

    expect(result.total).toBe(3);
    expect(result.totalPoints).toBe(8);
    expect(result.days[0]).toEqual(
      expect.objectContaining({
        remaining: 3,
        remainingPoints: 8,
      }),
    );
    expect(result.days.at(-1)).toEqual(
      expect.objectContaining({
        remaining: 2,
        remainingPoints: 3,
      }),
    );
  });
});
