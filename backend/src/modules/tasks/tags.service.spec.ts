import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TagsService } from './tags.service';

function makePrisma() {
  return {
    tag: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      findFirst: vi.fn(),
    },
    taskTag: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(makePrisma())),
  };
}

describe('TagsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TagsService;

  beforeEach(() => {
    prisma = makePrisma();
    prisma.$transaction = vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma));
    service = new TagsService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'ws-1' }) } as never,
    );
  });

  it('creates a workspace tag', async () => {
    prisma.tag.findFirst.mockResolvedValue(null);
    prisma.tag.create.mockResolvedValue({
      id: 'tag-1',
      name: 'Баг',
      color: '#EF4444',
      workspaceId: 'ws-1',
    });

    const result = await service.create('ws-1', 'user-1', { name: 'Баг', color: '#EF4444' });

    expect(result).toEqual(expect.objectContaining({ id: 'tag-1', name: 'Баг' }));
  });

  it('rejects duplicate tag names', async () => {
    prisma.tag.findFirst.mockResolvedValue({ id: 'tag-1', name: 'Баг' });

    await expect(
      service.create('ws-1', 'user-1', { name: 'Баг', color: '#EF4444' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sets task tags within the workspace only', async () => {
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1' });
    prisma.tag.findMany.mockResolvedValue([{ id: 'tag-1' }, { id: 'tag-2' }]);
    prisma.taskTag.findMany.mockResolvedValue([
      { tag: { id: 'tag-1', name: 'Баг', color: '#EF4444' } },
    ]);

    const result = await service.setTaskTags('ws-1', 'task-1', 'user-1', {
      tagIds: ['tag-1', 'tag-2', 'foreign'],
    });

    expect(prisma.taskTag.deleteMany).toHaveBeenCalledWith({ where: { taskId: 'task-1' } });
    expect(prisma.taskTag.createMany).toHaveBeenCalledWith({
      data: [
        { taskId: 'task-1', tagId: 'tag-1' },
        { taskId: 'task-1', tagId: 'tag-2' },
      ],
    });
    expect(result).toHaveLength(1);
  });

  it('throws when task is missing', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      service.setTaskTags('ws-1', 'missing', 'user-1', { tagIds: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
