import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DueRemindersService } from './due-reminders.service';

describe('DueRemindersService', () => {
  const prisma = {
    task: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    notification: { createMany: vi.fn() },
    workspace: { findMany: vi.fn() },
    workspaceMember: { findMany: vi.fn() },
    board: { findMany: vi.fn() },
    user: { findMany: vi.fn().mockResolvedValue([]) },
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
    service = new DueRemindersService(prisma as never, redis as never, { emit: vi.fn() } as never);
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
        dueDate: new Date('2030-01-01T12:00:00.000Z'),
        column: { board: { workspaceId: 'workspace-1' } },
      },
    ]);
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1', email: 'u@test.com', name: 'User' }]);
    prisma.workspaceMember.findMany.mockResolvedValue([
      { workspaceId: 'workspace-1', userId: 'user-1' },
    ]);

    await expect(service.syncBatch()).resolves.toBe(1);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          column: {
            board: {
              workspace: { deletedAt: null, archivedAt: null },
            },
          },
        }),
      }),
    );
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

  it('skips due reminders when assignee is no longer a workspace member', async () => {
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Сдать отчёт',
        assigneeId: 'ex-member',
        dueDate: new Date('2030-01-01T12:00:00.000Z'),
        column: { board: { workspaceId: 'workspace-1' } },
      },
    ]);
    prisma.workspaceMember.findMany.mockResolvedValue([]);

    await expect(service.syncBatch()).resolves.toBe(0);
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('returns 0 when nothing is due', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    await expect(service.syncBatch()).resolves.toBe(0);
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('only rolls overdue for active non-archived workspaces', async () => {
    prisma.workspace.findMany.mockResolvedValue([]);
    await expect(service.rollOverdueBatch()).resolves.toBe(0);
    expect(prisma.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          autoRollOverdue: true,
          deletedAt: null,
          archivedAt: null,
        },
      }),
    );
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
