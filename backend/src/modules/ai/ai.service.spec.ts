import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from './ai.service';

function makePrisma() {
  return {
    sprint: { findFirst: vi.fn() },
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    user: { findMany: vi.fn() },
    aiWorkspaceSetting: { findUnique: vi.fn() },
  };
}

describe('AiService.summarize', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let providerClient: { chatCompletion: ReturnType<typeof vi.fn> };
  let service: AiService;

  beforeEach(() => {
    prisma = makePrisma();
    providerClient = {
      chatCompletion: vi.fn().mockResolvedValue({
        content: 'Команда закрыла ключевые задачи.',
        model: 'gpt-test',
        usage: null,
      }),
    };

    prisma.aiWorkspaceSetting.findUnique.mockResolvedValue({
      provider: 'OPENAI',
      model: 'gpt-4o-mini',
      baseUrl: null,
      tokenCiphertext: 'cipher',
      tokenIv: 'iv',
      tokenAuthTag: 'tag',
    });
    prisma.user.findMany.mockResolvedValue([{ id: 'user-anna', name: 'Анна' }]);
    prisma.task.aggregate.mockResolvedValue({ _sum: { complexity: 5 } });
    prisma.task.groupBy.mockResolvedValue([{ assigneeId: 'user-anna', _count: { _all: 1 } }]);

    service = new AiService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
      { record: vi.fn() } as never,
      {
        get: vi.fn((key: string) =>
          key === 'AI_TOKEN_ENC_KEY' ? '0123456789abcdef0123456789abcdef' : undefined,
        ),
      } as never,
      providerClient as never,
    );

    vi.spyOn(
      service as unknown as { loadCredentials: (id: string) => Promise<unknown> },
      'loadCredentials',
    ).mockResolvedValue({
      provider: 'OPENAI',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiToken: 'sk-test',
    });
  });

  it('summarizes a sprint with aggregate stats from completed and open tasks', async () => {
    prisma.sprint.findFirst.mockResolvedValue({
      id: 'sprint-1',
      name: 'Sprint 7',
      startDate: new Date('2026-07-01T00:00:00.000Z'),
      endDate: new Date('2026-07-14T00:00:00.000Z'),
    });
    prisma.task.findMany
      .mockResolvedValueOnce([
        {
          title: 'Done A',
          completedAt: new Date('2026-07-05T12:00:00.000Z'),
          complexity: 5,
          assignee: { name: 'Анна' },
        },
      ])
      .mockResolvedValueOnce([
        {
          title: 'Open B',
          completedAt: null,
          complexity: 3,
          assignee: null,
        },
      ]);
    prisma.task.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    const result = await service.summarize('workspace-1', 'user-1', {
      scope: 'sprint',
      sprintId: 'sprint-1',
    });

    expect(result.scope).toBe('sprint');
    expect(result.stats).toEqual({
      completedCount: 1,
      completedPoints: 5,
      openCount: 1,
      topAssignees: [{ name: 'Анна', completedCount: 1 }],
    });
    expect(result.summary).toContain('закрыла');
    expect(providerClient.chatCompletion).toHaveBeenCalledTimes(1);
    const messages = providerClient.chatCompletion.mock.calls[0][0].messages;
    expect(messages[1].content).toContain('Done A');
    expect(messages[1].content).toContain('Open B');
  });

  it('summarizes a day by completedAt range', async () => {
    prisma.task.findMany.mockResolvedValue([
      {
        title: 'Shipped',
        completedAt: new Date('2026-07-21T10:00:00.000Z'),
        complexity: 2,
        assignee: { name: 'Борис' },
      },
    ]);
    prisma.task.count.mockResolvedValue(1);
    prisma.task.aggregate.mockResolvedValue({ _sum: { complexity: 2 } });
    prisma.task.groupBy.mockResolvedValue([{ assigneeId: null, _count: { _all: 1 } }]);

    const result = await service.summarize('workspace-1', 'user-1', {
      scope: 'day',
      date: '2026-07-21',
    });

    expect(result.scope).toBe('day');
    expect(result.stats.completedCount).toBe(1);
    expect(result.stats.openCount).toBe(0);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completedAt: expect.any(Object),
          column: { board: { workspaceId: 'workspace-1' } },
        }),
      }),
    );
  });

  it('rejects sprint summary without sprintId', async () => {
    await expect(
      service.summarize('workspace-1', 'user-1', { scope: 'sprint' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when sprint is missing', async () => {
    prisma.sprint.findFirst.mockResolvedValue(null);

    await expect(
      service.summarize('workspace-1', 'user-1', {
        scope: 'sprint',
        sprintId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
