import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';

describe('TasksService.duplicate', () => {
  const prisma = {
    task: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    taskTag: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    subtask: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    taskChecklistItem: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    customFieldValue: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const boardsService = {
    getBoardForWorkspace: vi.fn(),
    serializeTask: vi.fn((task) => ({ id: task.id, title: task.title })),
  };

  let service: TasksService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    );
    service = new TasksService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'ws-1' }) } as never,
      boardsService as never,
      { assertCanComplete: vi.fn() } as never,
      { prepare: vi.fn(), notify: vi.fn() } as never,
      { notifyWatchers: vi.fn() } as never,
      { assertDoDSatisfied: vi.fn().mockResolvedValue(undefined) } as never,
      {} as never,
      { emit: vi.fn() } as never,
    );
  });

  it('duplicates a task with tags and unchecked subtasks', async () => {
    prisma.task.findFirst
      .mockResolvedValueOnce({
        id: 'task-1',
        columnId: 'col-1',
        title: 'Релиз',
        description: 'Описание',
        priority: 'HIGH',
        complexity: 3,
        timeEstimateMinutes: 60,
        actualMinutes: 10,
        dueDate: new Date('2026-07-20T00:00:00.000Z'),
        assigneeId: 'user-2',
        recurrenceRule: 'NONE',
        recurrenceAction: 'DUPLICATE',
        recurrenceWeekdays: [],
        recurrenceOriginColumnId: null,
        position: 0,
      })
      .mockResolvedValueOnce({ position: 4 })
      .mockResolvedValueOnce({
        id: 'task-2',
        title: 'Релиз (копия)',
        columnId: 'col-1',
        position: 5,
        assignee: null,
        customFieldValues: [],
        taskTags: [{ tag: { id: 'tag-1', name: 'Баг', color: '#EF4444' } }],
        subtasks: [],
      });
    prisma.task.create.mockResolvedValue({
      id: 'task-2',
      title: 'Релиз (копия)',
      columnId: 'col-1',
      position: 5,
      assignee: null,
      customFieldValues: [],
      taskTags: [],
      subtasks: [],
    });
    prisma.taskTag.findMany.mockResolvedValue([{ tagId: 'tag-1' }]);
    prisma.subtask.findMany.mockResolvedValue([
      { title: 'Шаг', completed: true, position: 0 },
      { title: 'Шаг 2', completed: false, position: 1 },
    ]);
    prisma.taskChecklistItem.findMany.mockResolvedValue([]);
    prisma.customFieldValue.findMany.mockResolvedValue([{ fieldId: 'field-1', value: 'ok' }]);

    const result = await service.duplicate('ws-1', 'task-1', 'user-1');

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Релиз (копия)',
          columnId: 'col-1',
          position: 5,
          actualMinutes: null,
          timerStartedAt: null,
          completedAt: null,
          overdueDays: 0,
        }),
      }),
    );
    expect(prisma.taskTag.createMany).toHaveBeenCalledWith({
      data: [{ taskId: 'task-2', tagId: 'tag-1' }],
    });
    expect(prisma.subtask.createMany).toHaveBeenCalledWith({
      data: [
        { taskId: 'task-2', title: 'Шаг', completed: false, position: 0 },
        { taskId: 'task-2', title: 'Шаг 2', completed: false, position: 1 },
      ],
    });
    expect(prisma.customFieldValue.createMany).toHaveBeenCalledWith({
      data: [{ taskId: 'task-2', fieldId: 'field-1', value: 'ok' }],
    });
    expect(result).toEqual(expect.objectContaining({ id: 'task-2' }));
  });
});
