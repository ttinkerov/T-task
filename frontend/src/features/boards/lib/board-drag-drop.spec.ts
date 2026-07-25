import { describe, expect, it } from 'vitest';
import { resolveDropTarget } from './board-drag-drop';
import type { BoardTask, BoardView } from '../types';

function task(
  partial: Partial<BoardTask> & Pick<BoardTask, 'id' | 'columnId' | 'position'>,
): BoardTask {
  return {
    title: 't',
    description: null,
    priority: null,
    complexity: null,
    timeEstimateMinutes: null,
    actualMinutes: null,
    dueDate: null,
    assigneeId: null,
    sprintId: null,
    epicId: null,
    isEpic: false,
    completedAt: null,
    timerStartedAt: null,
    recurrenceRule: 'NONE',
    recurrenceAction: 'DUPLICATE',
    recurrenceWeekdays: [],
    recurrenceOriginColumnId: null,
    customFields: [],
    tags: [],
    subtasks: [],
    assignee: null,
    ...partial,
  } as BoardTask;
}

describe('resolveDropTarget', () => {
  const board = {
    columns: [
      {
        id: 'c1',
        name: 'Todo',
        tasks: [
          task({ id: 't1', columnId: 'c1', position: 0 }),
          task({ id: 't2', columnId: 'c1', position: 1 }),
        ],
      },
      {
        id: 'c2',
        name: 'Doing',
        tasks: [task({ id: 't3', columnId: 'c2', position: 0 })],
      },
    ],
  } as BoardView;

  it('drops onto another column at the end', () => {
    expect(resolveDropTarget(board, 'c2', 't1')).toEqual({ columnId: 'c2', position: 1 });
  });

  it('drops onto a task', () => {
    expect(resolveDropTarget(board, 't3', 't1')).toEqual({ columnId: 'c2', position: 0 });
  });
});
