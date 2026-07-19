import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DueRemindersService } from './due-reminders.service';

describe('DueRemindersService', () => {
  const prisma = {
    task: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    notification: { createMany: vi.fn() },
    workspace: { findMany: vi.fn() },
    board: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };

  const redis = {
    getClient: vi.fn().mockReturnValue({
      status: 'ready',
      set: vi.fn().mockResolvedValue('OK'),
      connect: vi.fn(),
    }),
  };

  let service: DueRemindersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DueRemindersService(prisma as never, redis as never);
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    prisma.workspace.findMany.mockResolvedValue([]);
  });

  it('creates due reminders for assignee tasks in the next 24h once', async () => {
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Сдать отчёт',
        assigneeId: 'user-1',
        column: { board: { workspaceId: 'workspace-1' } },
      },
    ]);

    await expect(service.syncBatch()).resolves.toBe(1);
    expect(prisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            type: 'DUE_REMINDER',
            preview: 'Скоро дедлайн: Сдать отчёт',
            actorId: null,
          }),
        ],
        skipDuplicates: true,
      }),
    );
    expect(prisma.task.updateMany).toHaveBeenCalled();
  });

  it('returns 0 when nothing is due', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    await expect(service.syncBatch()).resolves.toBe(0);
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('skips tick when redis lock is held', async () => {
    redis.getClient.mockReturnValue({
      status: 'ready',
      set: vi.fn().mockResolvedValue(null),
      connect: vi.fn(),
    });
    const syncSpy = vi.spyOn(service, 'syncBatch');
    await service.tick();
    expect(syncSpy).not.toHaveBeenCalled();
  });
});
