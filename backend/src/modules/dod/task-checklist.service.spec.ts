import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskChecklistService } from './task-checklist.service';

function makePrisma() {
  const prisma = {
    task: { findFirst: vi.fn() },
    dodTemplate: { findFirst: vi.fn() },
    taskChecklistItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
  );
  return prisma;
}

describe('TaskChecklistService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TaskChecklistService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new TaskChecklistService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
    );
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1' });
  });

  it('applies a template as a snapshot and skips duplicate texts', async () => {
    prisma.dodTemplate.findFirst.mockResolvedValue({
      id: 'tpl-1',
      workspaceId: 'workspace-1',
      gatesCompletion: true,
      items: [
        { id: 'i1', text: 'Tests', position: 0 },
        { id: 'i2', text: 'Review', position: 1 },
      ],
    });
    prisma.taskChecklistItem.findMany
      .mockResolvedValueOnce([{ text: 'Tests', position: 0 }])
      .mockResolvedValueOnce([
        {
          id: 'c1',
          text: 'Tests',
          completed: false,
          required: true,
          position: 0,
          sourceTemplateId: null,
        },
        {
          id: 'c2',
          text: 'Review',
          completed: false,
          required: true,
          position: 1,
          sourceTemplateId: 'tpl-1',
        },
      ]);

    const result = await service.applyTemplate('workspace-1', 'task-1', 'user-1', {
      templateId: 'tpl-1',
    });

    expect(prisma.taskChecklistItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          text: 'Review',
          required: true,
          sourceTemplateId: 'tpl-1',
          position: 1,
        }),
      ],
    });
    expect(result).toHaveLength(2);
  });

  it('blocks completion when required checklist items are open', async () => {
    prisma.taskChecklistItem.findMany.mockResolvedValue([
      { text: 'Code review' },
      { text: 'QA pass' },
    ]);

    await expect(service.assertDoDSatisfied('task-1')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.assertDoDSatisfied('task-1')).rejects.toThrow(/Code review/);
  });

  it('allows completion when no required items remain', async () => {
    prisma.taskChecklistItem.findMany.mockResolvedValue([]);
    await expect(service.assertDoDSatisfied('task-1')).resolves.toBeUndefined();
  });

  it('throws when template is missing', async () => {
    prisma.dodTemplate.findFirst.mockResolvedValue(null);
    await expect(
      service.applyTemplate('workspace-1', 'task-1', 'user-1', { templateId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
