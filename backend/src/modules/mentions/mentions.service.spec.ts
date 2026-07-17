import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MentionsService } from './mentions.service';

function makePrisma() {
  return {
    workspaceMember: {
      findMany: vi.fn(),
    },
    notification: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn(),
    },
  };
}

describe('MentionsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: MentionsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new MentionsService(prisma as never);
  });

  it('keeps only workspace members, excludes the actor, and normalizes labels', async () => {
    prisma.workspaceMember.findMany.mockResolvedValue([
      { userId: 'cm12345678901234567890', user: { name: 'Анна Иванова' } },
      { userId: 'cm09876543210987654321', user: { name: 'Автор' } },
    ]);

    const result = await service.prepare(
      'workspace-1',
      'cm09876543210987654321',
      '@[Старое имя](cm12345678901234567890) @[Автор](cm09876543210987654321) ' +
        '@[Чужой](cm11111111111111111111)',
    );

    expect(result.text).toBe(
      '@[Анна Иванова](cm12345678901234567890) @[Автор](cm09876543210987654321) ' +
        '@[Чужой](cm11111111111111111111)',
    );
    expect(result.recipientIds).toEqual(['cm12345678901234567890']);
    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workspaceId: 'workspace-1',
          userId: {
            in: ['cm12345678901234567890', 'cm09876543210987654321', 'cm11111111111111111111'],
          },
        },
      }),
    );
  });

  it('creates one notification per recipient', async () => {
    prisma.notification.createMany.mockResolvedValue({ count: 2 });

    await service.notify(
      prisma as never,
      {
        workspaceId: 'workspace-1',
        actorId: 'actor-1',
        taskId: 'task-1',
        commentId: 'comment-1',
        sourceType: 'COMMENT',
        preview: 'Проверь задачу',
      },
      ['user-1', 'user-2'],
    );

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ recipientId: 'user-1', commentId: 'comment-1' }),
        expect.objectContaining({ recipientId: 'user-2', commentId: 'comment-1' }),
      ],
    });
  });

  it('skips recipients already notified for the same comment', async () => {
    prisma.notification.findMany.mockResolvedValue([{ recipientId: 'user-1' }]);

    await service.notify(
      prisma as never,
      {
        workspaceId: 'workspace-1',
        actorId: 'actor-1',
        taskId: 'task-1',
        commentId: 'comment-1',
        sourceType: 'COMMENT',
        preview: 'Проверь задачу',
      },
      ['user-1', 'user-2'],
    );

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ recipientId: 'user-2', commentId: 'comment-1' })],
    });
  });

  it('does not write notifications for an empty recipient list', async () => {
    await service.notify(
      prisma as never,
      {
        workspaceId: 'workspace-1',
        actorId: 'actor-1',
        taskId: 'task-1',
        sourceType: 'TASK_DESCRIPTION',
        preview: '',
      },
      [],
    );

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });
});
