import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from './ai.service';

function makePrisma() {
  const prisma = {
    sprint: { findFirst: vi.fn() },
    boardColumn: { findFirst: vi.fn() },
    task: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
    },
    user: { findMany: vi.fn() },
    aiWorkspaceSetting: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) =>
    callback(prisma),
  );
  return prisma;
}

function makeCredentials() {
  return {
    loadChatCredentials: vi.fn().mockResolvedValue({
      provider: 'OPENAI',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiToken: 'sk-test',
    }),
  };
}

function createService(
  prisma: ReturnType<typeof makePrisma>,
  providerClient: { chatCompletion: ReturnType<typeof vi.fn> },
  activityService: { record: ReturnType<typeof vi.fn> },
  analyticsService: { stuckTasks: ReturnType<typeof vi.fn> } = { stuckTasks: vi.fn() },
) {
  return new AiService(
    prisma as never,
    { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
    activityService as never,
    {
      get: vi.fn((key: string) =>
        key === 'AI_TOKEN_ENC_KEY' ? Buffer.alloc(32).toString('base64') : undefined,
      ),
    } as never,
    providerClient as never,
    analyticsService as never,
    {} as never,
    {} as never,
    {} as never,
    makeCredentials() as never,
  );
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

    service = createService(prisma, providerClient, { record: vi.fn() });
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

    expect(result.stats.completedCount).toBe(1);
    expect(result.stats.openCount).toBe(1);
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

describe('AiService epic breakdown', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let providerClient: { chatCompletion: ReturnType<typeof vi.fn> };
  let activityService: { record: ReturnType<typeof vi.fn> };
  let service: AiService;

  beforeEach(() => {
    prisma = makePrisma();
    providerClient = { chatCompletion: vi.fn() };
    activityService = { record: vi.fn() };
    service = createService(prisma, providerClient, activityService);

    prisma.task.findFirst.mockResolvedValue({
      id: 'epic-1',
      title: 'Онбординг',
      description: 'Сделать онбординг новых пользователей',
      columnId: 'col-todo',
    });
    prisma.boardColumn.findFirst.mockResolvedValue({ id: 'col-todo' });
  });

  it('proposes parsed draft tasks from JSON response', async () => {
    providerClient.chatCompletion.mockResolvedValue({
      content: JSON.stringify({
        tasks: [
          { title: 'Экран приветствия', description: 'Первый шаг' },
          { title: 'Туториал', description: '' },
        ],
      }),
      model: 'gpt-test',
    });

    const result = await service.proposeEpicBreakdown('workspace-1', 'user-1', 'epic-1', {});

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].title).toBe('Экран приветствия');
  });

  it('rejects malformed LLM JSON', async () => {
    providerClient.chatCompletion.mockResolvedValue({
      content: 'not-json',
      model: 'gpt-test',
    });

    await expect(
      service.proposeEpicBreakdown('workspace-1', 'user-1', 'epic-1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when epic is missing', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      service.proposeEpicBreakdown('workspace-1', 'user-1', 'missing', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applies drafts atomically under the epic', async () => {
    prisma.task.findFirst
      .mockResolvedValueOnce({
        id: 'epic-1',
        title: 'Онбординг',
        description: 'desc',
        columnId: 'col-todo',
      })
      .mockResolvedValueOnce({ position: 2 });
    prisma.task.create
      .mockResolvedValueOnce({ id: 'task-1', title: 'A', epicId: 'epic-1' })
      .mockResolvedValueOnce({ id: 'task-2', title: 'B', epicId: 'epic-1' });

    const result = await service.applyEpicBreakdown('workspace-1', 'user-1', 'epic-1', {
      tasks: [{ title: 'A', description: 'one' }, { title: 'B' }],
    });

    expect(result.createdCount).toBe(2);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.task.create).toHaveBeenCalledTimes(2);
    expect(activityService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_EPIC_BREAKDOWN_APPLIED',
        entityId: 'epic-1',
        metadata: { count: 2 },
      }),
    );
  });
});

describe('AiService.stuckTasksInsight', () => {
  it('builds insight from stuck tasks facts', async () => {
    const providerClient = {
      chatCompletion: vi.fn().mockResolvedValue({
        content: 'Задачи зависли во «В работе».',
        model: 'gpt-test',
      }),
    };
    const analyticsService = {
      stuckTasks: vi.fn().mockResolvedValue({
        days: 5,
        count: 1,
        truncated: false,
        tasks: [
          {
            title: 'Застряла',
            columnName: 'В работе',
            daysSinceUpdate: 8,
            assignee: { name: 'Анна' },
          },
        ],
      }),
    };

    const service = createService(
      makePrisma(),
      providerClient,
      { record: vi.fn() },
      analyticsService,
    );

    const result = await service.stuckTasksInsight('workspace-1', 'user-1', { days: 5 });

    expect(result.basedOnCount).toBe(1);
    expect(result.insight).toContain('зависли');
    expect(providerClient.chatCompletion.mock.calls[0][0].messages[1].content).toContain(
      'Застряла',
    );
  });
});
