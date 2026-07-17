import { ConflictException } from '@nestjs/common';
import { ColumnAutomationAction } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';

function makePrisma() {
  const prisma = {
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    task: {
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    boardColumn: {
      findFirst: vi.fn(),
    },
    board: {
      findFirstOrThrow: vi.fn(),
    },
  };
  prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
  return prisma;
}

describe('TasksService completion dependencies', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let relationsService: { assertCanComplete: ReturnType<typeof vi.fn> };
  let service: TasksService;

  beforeEach(() => {
    prisma = makePrisma();
    relationsService = {
      assertCanComplete: vi
        .fn()
        .mockRejectedValue(new ConflictException('Сначала завершите блокирующие задачи')),
    };
    service = new TasksService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
      {} as never,
      relationsService as never,
    );
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-b',
      columnId: 'column-todo',
      position: 0,
    });
    prisma.board.findFirstOrThrow.mockResolvedValue({
      columns: [
        { id: 'column-todo', name: 'К работе', position: 0 },
        { id: 'column-progress', name: 'В работе', position: 1 },
        { id: 'column-done', name: 'Готово', position: 2 },
      ],
    });
  });

  it('prevents moving a blocked task into the done column', async () => {
    prisma.boardColumn.findFirst.mockResolvedValue({
      id: 'column-done',
      name: 'Готово',
      position: 2,
      automations: [],
    });

    await expect(
      service.move('workspace-1', 'task-b', 'user-1', {
        columnId: 'column-done',
        position: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(relationsService.assertCanComplete).toHaveBeenCalledWith('task-b', prisma);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('prevents COMPLETE_TASK automation from bypassing blockers', async () => {
    prisma.boardColumn.findFirst.mockResolvedValue({
      id: 'column-progress',
      name: 'В работе',
      position: 1,
      automations: [
        {
          action: ColumnAutomationAction.COMPLETE_TASK,
          assigneeId: null,
        },
      ],
    });

    await expect(
      service.move('workspace-1', 'task-b', 'user-1', {
        columnId: 'column-progress',
        position: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(relationsService.assertCanComplete).toHaveBeenCalledWith('task-b', prisma);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});
