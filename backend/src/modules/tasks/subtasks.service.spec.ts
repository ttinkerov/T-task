import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubtasksService } from './subtasks.service';

function makePrisma() {
  return {
    task: { findFirst: vi.fn() },
    subtask: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('SubtasksService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: SubtasksService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new SubtasksService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'ws-1' }) } as never,
    );
  });

  it('creates a subtask at the end of the list', async () => {
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1' });
    prisma.subtask.findFirst.mockResolvedValue({ position: 1 });
    prisma.subtask.create.mockResolvedValue({
      id: 'sub-1',
      taskId: 'task-1',
      title: 'Шаг 1',
      completed: false,
      position: 2,
    });

    const result = await service.create('ws-1', 'task-1', 'user-1', { title: 'Шаг 1' });

    expect(prisma.subtask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ taskId: 'task-1', title: 'Шаг 1', position: 2 }),
      }),
    );
    expect(result.title).toBe('Шаг 1');
  });

  it('toggles completion', async () => {
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1' });
    prisma.subtask.findFirst.mockResolvedValue({
      id: 'sub-1',
      taskId: 'task-1',
      title: 'Шаг',
      completed: false,
      position: 0,
    });
    prisma.subtask.update.mockResolvedValue({
      id: 'sub-1',
      taskId: 'task-1',
      title: 'Шаг',
      completed: true,
      position: 0,
    });

    const result = await service.update('ws-1', 'task-1', 'sub-1', 'user-1', { completed: true });

    expect(result.completed).toBe(true);
  });

  it('rejects subtasks for missing tasks', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      service.create('ws-1', 'missing', 'user-1', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
