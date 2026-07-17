import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentsService } from './comments.service';

function makePrisma() {
  const prisma = {
    task: { findFirst: vi.fn() },
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: { findUnique: vi.fn() },
    notification: { createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => Promise<unknown>) =>
    callback(prisma),
  );
  return prisma;
}

describe('CommentsService mentions', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let mentions: {
    prepare: ReturnType<typeof vi.fn>;
    notify: ReturnType<typeof vi.fn>;
  };
  let service: CommentsService;

  beforeEach(() => {
    prisma = makePrisma();
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1', title: 'Запуск' });
    prisma.comment.create.mockResolvedValue({
      id: 'comment-1',
      body: '@[Анна](cm12345678901234567890), проверь',
      authorId: 'author-1',
      createdAt: new Date('2026-07-17T00:00:00.000Z'),
      author: {
        id: 'author-1',
        name: 'Автор',
        email: 'author@example.com',
        avatarUrl: null,
      },
    });
    mentions = {
      prepare: vi.fn().mockResolvedValue({
        text: '@[Анна](cm12345678901234567890), проверь',
        recipientIds: ['cm12345678901234567890'],
      }),
      notify: vi.fn().mockResolvedValue(undefined),
    };
    service = new CommentsService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
      mentions as never,
    );
  });

  it('normalizes mentions and creates notifications atomically with the comment', async () => {
    await service.create('workspace-1', 'task-1', 'author-1', {
      body: '@[Старое имя](cm12345678901234567890), проверь',
    });

    expect(mentions.prepare).toHaveBeenCalledWith(
      'workspace-1',
      'author-1',
      '@[Старое имя](cm12345678901234567890), проверь',
    );
    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          body: '@[Анна](cm12345678901234567890), проверь',
        }),
      }),
    );
    expect(mentions.notify).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        workspaceId: 'workspace-1',
        taskId: 'task-1',
        commentId: 'comment-1',
        sourceType: 'COMMENT',
      }),
      ['cm12345678901234567890'],
    );
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});
