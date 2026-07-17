import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TaskRelationType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskRelationsService } from './task-relations.service';

function makePrisma() {
  return {
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    taskRelation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

function makeWorkspacesService() {
  return {
    getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }),
  };
}

function makeActivityService() {
  return {
    record: vi.fn().mockResolvedValue(undefined),
  };
}

const currentTask = {
  id: 'task-b',
  title: 'Выпустить релиз',
  columnId: 'column-todo',
  completedAt: null,
  column: {
    name: 'К работе',
    position: 0,
    board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
  },
};

const relatedTask = {
  id: 'task-a',
  title: 'Закончить тесты',
  columnId: 'column-progress',
  completedAt: null,
  column: {
    name: 'В работе',
    position: 1,
    board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
  },
};

describe('TaskRelationsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let workspacesService: ReturnType<typeof makeWorkspacesService>;
  let activityService: ReturnType<typeof makeActivityService>;
  let service: TaskRelationsService;

  beforeEach(() => {
    prisma = makePrisma();
    workspacesService = makeWorkspacesService();
    activityService = makeActivityService();
    service = new TaskRelationsService(
      prisma as never,
      workspacesService as never,
      activityService as never,
    );
    prisma.task.findMany.mockResolvedValue([currentTask, relatedTask]);
    prisma.task.findUnique.mockResolvedValue(currentTask);
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
    prisma.taskRelation.findFirst.mockResolvedValue(null);
    prisma.taskRelation.findMany.mockResolvedValue([]);
    prisma.taskRelation.create.mockImplementation(({ data }) => ({
      id: 'relation-1',
      ...data,
      createdAt: new Date('2026-07-17T04:00:00.000Z'),
    }));
    prisma.taskRelation.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('stores a blocking relation in the requested direction', async () => {
    await service.create('workspace-1', 'task-a', 'user-1', {
      relatedTaskId: 'task-b',
      type: 'BLOCKS',
    });

    expect(prisma.taskRelation.create).toHaveBeenCalledWith({
      data: {
        sourceTaskId: 'task-a',
        targetTaskId: 'task-b',
        pairKey: 'task-a:task-b',
        type: TaskRelationType.BLOCKS,
      },
    });
  });

  it('normalizes a waiting relation by reversing the blocking edge', async () => {
    await service.create('workspace-1', 'task-b', 'user-1', {
      relatedTaskId: 'task-a',
      type: 'WAITING_FOR',
    });

    expect(prisma.taskRelation.create).toHaveBeenCalledWith({
      data: {
        sourceTaskId: 'task-a',
        targetTaskId: 'task-b',
        pairKey: 'task-a:task-b',
        type: TaskRelationType.BLOCKS,
      },
    });
  });

  it('canonicalizes symmetric links so reverse duplicates are impossible', async () => {
    await service.create('workspace-1', 'task-b', 'user-1', {
      relatedTaskId: 'task-a',
      type: 'RELATES_TO',
    });

    expect(prisma.taskRelation.create).toHaveBeenCalledWith({
      data: {
        sourceTaskId: 'task-a',
        targetTaskId: 'task-b',
        pairKey: 'task-a:task-b',
        type: TaskRelationType.RELATES_TO,
      },
    });
  });

  it('rejects self-links and tasks outside the workspace', async () => {
    await expect(
      service.create('workspace-1', 'task-a', 'user-1', {
        relatedTaskId: 'task-a',
        type: 'BLOCKS',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.task.findMany.mockResolvedValue([currentTask]);
    await expect(
      service.create('workspace-1', 'task-b', 'user-1', {
        relatedTaskId: 'task-external',
        type: 'BLOCKS',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects duplicate relations and directed dependency cycles', async () => {
    prisma.taskRelation.findFirst.mockResolvedValueOnce({ id: 'existing' });
    await expect(
      service.create('workspace-1', 'task-a', 'user-1', {
        relatedTaskId: 'task-b',
        type: 'BLOCKS',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.taskRelation.findFirst.mockResolvedValueOnce(null);
    prisma.taskRelation.findMany.mockResolvedValueOnce([
      { sourceTaskId: 'task-b', targetTaskId: 'task-c' },
      { sourceTaskId: 'task-c', targetTaskId: 'task-a' },
    ]);
    await expect(
      service.create('workspace-1', 'task-a', 'user-1', {
        relatedTaskId: 'task-b',
        type: 'BLOCKS',
      }),
    ).rejects.toThrow('Циклическая зависимость задач недопустима');
  });

  it('lists blocking, waiting, and symmetric relations relative to the selected task', async () => {
    prisma.task.findMany.mockResolvedValue([currentTask]);
    prisma.taskRelation.findMany.mockResolvedValue([
      {
        id: 'r1',
        type: TaskRelationType.BLOCKS,
        sourceTaskId: 'task-b',
        targetTaskId: 'task-c',
        sourceTask: {
          ...currentTask,
          completedAt: null,
          column: {
            name: 'В работе',
            position: 1,
            board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
          },
        },
        targetTask: {
          id: 'task-c',
          title: 'Опубликовать релиз',
          columnId: 'column-todo',
          completedAt: null,
          column: {
            name: 'К работе',
            position: 0,
            board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
          },
        },
      },
      {
        id: 'r2',
        type: TaskRelationType.BLOCKS,
        sourceTaskId: 'task-a',
        targetTaskId: 'task-b',
        sourceTask: {
          ...relatedTask,
          completedAt: new Date(),
          column: {
            name: 'Готово',
            position: 2,
            board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
          },
        },
        targetTask: {
          ...currentTask,
          completedAt: null,
          column: {
            name: 'В работе',
            position: 1,
            board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
          },
        },
      },
      {
        id: 'r3',
        type: TaskRelationType.RELATES_TO,
        sourceTaskId: 'task-a',
        targetTaskId: 'task-b',
        sourceTask: {
          ...relatedTask,
          completedAt: null,
          column: {
            name: 'В работе',
            position: 1,
            board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
          },
        },
        targetTask: {
          ...currentTask,
          completedAt: null,
          column: {
            name: 'В работе',
            position: 1,
            board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
          },
        },
      },
    ]);

    await expect(service.list('workspace-1', 'task-b', 'user-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'r1',
        type: 'BLOCKS',
        task: expect.objectContaining({ id: 'task-c' }),
      }),
      expect.objectContaining({
        id: 'r2',
        type: 'WAITING_FOR',
        task: expect.objectContaining({ id: 'task-a', completed: true }),
      }),
      expect.objectContaining({
        id: 'r3',
        type: 'RELATES_TO',
        task: expect.objectContaining({ id: 'task-a' }),
      }),
    ]);
  });

  it('prevents completion while an incoming blocker is unfinished', async () => {
    prisma.taskRelation.findMany.mockResolvedValue([
      {
        sourceTask: {
          id: 'task-a',
          title: 'Закончить тесты',
          completedAt: null,
          column: {
            name: 'В работе',
            position: 1,
            board: { columns: [{ position: 0 }, { position: 1 }, { position: 2 }] },
          },
        },
      },
    ]);

    await expect(service.assertCanComplete('task-b')).rejects.toThrow(
      'Сначала завершите блокирующие задачи: Закончить тесты',
    );
  });

  it('removes only a relation attached to the selected workspace task', async () => {
    prisma.task.findMany.mockResolvedValue([currentTask]);
    prisma.taskRelation.findFirst.mockResolvedValue({
      id: 'relation-1',
      sourceTaskId: 'task-a',
      targetTaskId: 'task-b',
      type: TaskRelationType.BLOCKS,
      sourceTask: { title: 'Закончить тесты' },
      targetTask: { title: 'Выпустить релиз' },
    });

    await expect(service.remove('workspace-1', 'task-b', 'relation-1', 'user-1')).resolves.toEqual({
      success: true,
    });
    expect(prisma.taskRelation.deleteMany).toHaveBeenCalledWith({
      where: { id: 'relation-1' },
    });
  });
});
