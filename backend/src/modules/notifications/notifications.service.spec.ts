import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service';

function makePrisma() {
  return {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  };
}

describe('NotificationsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: NotificationsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new NotificationsService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
    );
  });

  it('lists only the current recipient notifications and returns unread count', async () => {
    prisma.notification.findMany.mockResolvedValue([
      {
        id: 'notification-1',
        type: 'MENTION',
        sourceType: 'COMMENT',
        preview: '@Анна, проверь',
        readAt: null,
        createdAt: new Date('2026-07-17T00:00:00.000Z'),
        task: { id: 'task-1', title: 'Запуск' },
        actor: { id: 'actor-1', name: 'Иван', avatarUrl: null },
      },
    ]);
    prisma.notification.count.mockResolvedValue(1);

    const result = await service.list('workspace-1', 'user-1');

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 'workspace-1', recipientId: 'user-1' },
        take: 50,
      }),
    );
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: 'notification-1',
          read: false,
          task: { id: 'task-1', title: 'Запуск' },
        }),
      ],
      unreadCount: 1,
    });
  });

  it('marks one notification read only when it belongs to the recipient', async () => {
    prisma.notification.updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(service.markRead('workspace-1', 'notification-1', 'user-1')).resolves.toEqual({
      success: true,
    });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'notification-1',
        workspaceId: 'workspace-1',
        recipientId: 'user-1',
      },
      data: { readAt: expect.any(Date) },
    });

    prisma.notification.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.markRead('workspace-1', 'notification-x', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks all current-user notifications read without touching other users', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 3 });

    await expect(service.markAllRead('workspace-1', 'user-1')).resolves.toEqual({
      success: true,
      updated: 3,
    });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        workspaceId: 'workspace-1',
        recipientId: 'user-1',
        readAt: null,
      },
      data: { readAt: expect.any(Date) },
    });
  });
});
