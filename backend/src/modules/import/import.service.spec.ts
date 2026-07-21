import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportService } from './import.service';

function makePrisma() {
  const prisma = {
    board: { findFirst: vi.fn() },
    boardColumn: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    workspaceMember: { findMany: vi.fn() },
    tag: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    task: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    taskTag: { createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
  return prisma;
}

describe('ImportService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: ImportService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ImportService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
      { getBoardForWorkspace: vi.fn().mockResolvedValue({ id: 'board-1' }) } as never,
    );
    prisma.workspaceMember.findMany.mockResolvedValue([
      {
        userId: 'user-anna',
        user: { email: 'anna@example.com', name: 'Анна' },
      },
    ]);
  });

  it('creates tasks with mapped columns, tags and assignee', async () => {
    prisma.boardColumn.findMany.mockResolvedValue([
      { id: 'col-todo', name: 'К работе', position: 0 },
      { id: 'col-done', name: 'Готово', position: 1 },
    ]);
    prisma.tag.findMany.mockResolvedValue([{ id: 'tag-bug', name: 'Bug' }]);
    prisma.task.findFirst.mockResolvedValue(null);
    prisma.task.create
      .mockResolvedValueOnce({ id: 'task-1' })
      .mockResolvedValueOnce({ id: 'task-2' });
    prisma.tag.create.mockResolvedValue({ id: 'tag-new', name: 'Frontend' });

    const result = await service.importTasks('workspace-1', 'user-1', {
      columnMappings: [
        { status: 'To Do', columnId: 'col-todo' },
        { status: 'Done', columnId: 'col-done' },
      ],
      rows: [
        {
          title: 'Первая',
          status: 'To Do',
          priority: 'HIGH',
          assignee: 'anna@example.com',
          labels: ['Bug', 'Frontend'],
        },
        {
          title: 'Вторая',
          status: 'Done',
          labels: [],
        },
      ],
    });

    expect(result.created).toBe(2);
    expect(result.skipped).toBe(0);
    expect(prisma.task.create).toHaveBeenCalledTimes(2);
    expect(prisma.taskTag.createMany).toHaveBeenCalled();
  });

  it('skips rows with blank titles or unmapped status', async () => {
    prisma.boardColumn.findMany.mockResolvedValue([
      { id: 'col-todo', name: 'К работе', position: 0 },
    ]);
    prisma.tag.findMany.mockResolvedValue([]);
    prisma.task.findFirst.mockResolvedValue(null);

    const result = await service.importTasks('workspace-1', 'user-1', {
      columnMappings: [{ status: 'To Do', columnId: 'col-todo' }],
      rows: [
        { title: '   ', status: 'To Do' },
        { title: 'Ок', status: 'Unknown' },
      ],
    });

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(2);
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('rejects mappings without a column target', async () => {
    prisma.boardColumn.findMany.mockResolvedValue([
      { id: 'col-todo', name: 'К работе', position: 0 },
    ]);
    prisma.tag.findMany.mockResolvedValue([]);

    await expect(
      service.importTasks('workspace-1', 'user-1', {
        columnMappings: [{ status: 'To Do' }],
        rows: [{ title: 'Задача', status: 'To Do' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
