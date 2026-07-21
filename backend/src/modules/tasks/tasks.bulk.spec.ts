import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';

function makePrisma() {
  const prisma = {
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    task: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    sprint: {
      findFirst: vi.fn(),
    },
    boardColumn: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  };
  prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
  return prisma;
}

describe('TasksService.bulkUpdate', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TasksService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new TasksService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
      {} as never,
      { assertCanComplete: vi.fn().mockResolvedValue(undefined) } as never,
      { prepare: vi.fn(), notify: vi.fn() } as never,
      { notifyWatchers: vi.fn() } as never,
      { assertDoDSatisfied: vi.fn().mockResolvedValue(undefined) } as never,
      { emit: vi.fn() } as never,
    );
  });

  it('rejects when no patch fields are provided', async () => {
    await expect(
      service.bulkUpdate('workspace-1', 'user-1', {
        taskIds: ['task-aaaaaaaaaaaaaaaaaaaa'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates assignee and priority via updateMany', async () => {
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-aaaaaaaaaaaaaaaaaaaa',
        columnId: 'col-1',
        position: 0,
        assigneeId: null,
        completedAt: null,
        column: { boardId: 'board-1', position: 0 },
      },
      {
        id: 'task-bbbbbbbbbbbbbbbbbbbb',
        columnId: 'col-1',
        position: 1,
        assigneeId: null,
        completedAt: null,
        column: { boardId: 'board-1', position: 0 },
      },
    ]);
    prisma.workspaceMember.findUnique.mockResolvedValue({ id: 'mem-1' });

    const result = await service.bulkUpdate('workspace-1', 'user-1', {
      taskIds: ['task-aaaaaaaaaaaaaaaaaaaa', 'task-bbbbbbbbbbbbbbbbbbbb'],
      assigneeId: 'user-cccccccccccccccccccc',
      priority: 'HIGH',
    });

    expect(prisma.task.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['task-aaaaaaaaaaaaaaaaaaaa', 'task-bbbbbbbbbbbbbbbbbbbb'] } },
      data: { assigneeId: 'user-cccccccccccccccccccc', priority: 'HIGH' },
    });
    expect(result.updated).toBe(2);
  });

  it('rejects bulk move across boards', async () => {
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-aaaaaaaaaaaaaaaaaaaa',
        columnId: 'col-1',
        position: 0,
        assigneeId: null,
        completedAt: null,
        column: { boardId: 'board-1', position: 0 },
      },
      {
        id: 'task-bbbbbbbbbbbbbbbbbbbb',
        columnId: 'col-2',
        position: 0,
        assigneeId: null,
        completedAt: null,
        column: { boardId: 'board-2', position: 0 },
      },
    ]);
    prisma.boardColumn.findFirst.mockResolvedValue({
      id: 'col-done',
      boardId: 'board-1',
      name: 'Готово',
      position: 2,
    });

    await expect(
      service.bulkUpdate('workspace-1', 'user-1', {
        taskIds: ['task-aaaaaaaaaaaaaaaaaaaa', 'task-bbbbbbbbbbbbbbbbbbbb'],
        columnId: 'col-donecol-donecol-done1',
      }),
    ).rejects.toThrow(/разных досок/);
  });

  it('rejects when some tasks are missing from the workspace', async () => {
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-aaaaaaaaaaaaaaaaaaaa',
        columnId: 'col-1',
        position: 0,
        assigneeId: null,
        completedAt: null,
        column: { boardId: 'board-1', position: 0 },
      },
    ]);

    await expect(
      service.bulkUpdate('workspace-1', 'user-1', {
        taskIds: ['task-aaaaaaaaaaaaaaaaaaaa', 'task-bbbbbbbbbbbbbbbbbbbb'],
        priority: 'LOW',
      }),
    ).rejects.toThrow(/не найдены/);
  });
});
