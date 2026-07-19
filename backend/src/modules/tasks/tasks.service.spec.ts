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
      { prepare: vi.fn(), notify: vi.fn() } as never,
    );
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-b',
      columnId: 'column-todo',
      position: 0,
    });
    prisma.board.findFirstOrThrow.mockResolvedValue({
      id: 'board-1',
      columns: [
        { id: 'column-todo', name: 'К работе', position: 0 },
        { id: 'column-progress', name: 'В работе', position: 1 },
        { id: 'column-done', name: 'Готово', position: 2 },
      ],
    });
  });

  it('prevents moving a blocked task into the done column', async () => {
    prisma.boardColumn.findFirst
      .mockResolvedValueOnce({
        id: 'column-done',
        boardId: 'board-1',
        name: 'Готово',
        position: 2,
        automations: [],
      })
      .mockResolvedValueOnce({ id: 'column-todo', boardId: 'board-1' });

    await expect(
      service.move('workspace-1', 'task-b', 'user-1', {
        columnId: 'column-done',
        position: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(relationsService.assertCanComplete).toHaveBeenCalledWith('task-b', prisma);
    expect(prisma.task.update).not.toHaveBeenCalled();
    expect(prisma.board.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'board-1', workspaceId: 'workspace-1' } }),
    );
  });

  it('prevents COMPLETE_TASK automation from bypassing blockers', async () => {
    prisma.boardColumn.findFirst
      .mockResolvedValueOnce({
        id: 'column-progress',
        boardId: 'board-1',
        name: 'В работе',
        position: 1,
        automations: [
          {
            action: ColumnAutomationAction.COMPLETE_TASK,
            assigneeId: null,
          },
        ],
      })
      .mockResolvedValueOnce({ id: 'column-todo', boardId: 'board-1' });

    await expect(
      service.move('workspace-1', 'task-b', 'user-1', {
        columnId: 'column-progress',
        position: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(relationsService.assertCanComplete).toHaveBeenCalledWith('task-b', prisma);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('rejects moving a task onto a column from another board', async () => {
    prisma.boardColumn.findFirst
      .mockResolvedValueOnce({
        id: 'column-other',
        boardId: 'board-2',
        name: 'Бэклог',
        position: 0,
        automations: [],
      })
      .mockResolvedValueOnce({ id: 'column-todo', boardId: 'board-1' });

    await expect(
      service.move('workspace-1', 'task-b', 'user-1', {
        columnId: 'column-other',
        position: 0,
      }),
    ).rejects.toMatchObject({ message: 'Нельзя переносить задачу на другую доску' });

    expect(prisma.board.findFirstOrThrow).not.toHaveBeenCalled();
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});

describe('TasksService description mentions', () => {
  it('notifies only newly mentioned members in the task update transaction', async () => {
    const prisma = makePrisma();
    const mentions = {
      prepare: vi.fn().mockResolvedValue({
        text: '@[Анна](cm12345678901234567890) @[Борис](cm22222222222222222222), проверьте',
        recipientIds: ['cm12345678901234567890', 'cm22222222222222222222'],
      }),
      notify: vi.fn().mockResolvedValue(undefined),
    };
    const existingTask = {
      id: 'task-1',
      title: 'Запуск',
      description: '@[Анна](cm12345678901234567890), посмотри',
      columnId: 'column-1',
      position: 0,
      recurrenceOriginColumnId: null,
    };
    prisma.task.findFirst.mockResolvedValue(existingTask);
    prisma.task.update.mockResolvedValue({
      ...existingTask,
      description: '@[Анна](cm12345678901234567890) @[Борис](cm22222222222222222222), проверьте',
    });
    const service = new TasksService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
      { getBoardForWorkspace: vi.fn(), serializeTask: vi.fn((task) => task) } as never,
      { assertCanComplete: vi.fn() } as never,
      mentions as never,
    );

    await service.update('workspace-1', 'task-1', 'author-1', {
      description:
        '@[Старое имя](cm12345678901234567890) @[Борис](cm22222222222222222222), проверьте',
    });

    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description:
            '@[Анна](cm12345678901234567890) @[Борис](cm22222222222222222222), проверьте',
        }),
      }),
    );
    expect(mentions.notify).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        taskId: 'task-1',
        sourceType: 'TASK_DESCRIPTION',
      }),
      ['cm22222222222222222222'],
    );
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});
