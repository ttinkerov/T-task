import { describe, expect, it } from 'vitest';
import { getAgingLevel } from './overdue';
import type { BoardColumn, BoardTask } from '../types';

const columns: BoardColumn[] = [
  { id: 'c1', name: 'Todo', position: 0, wipLimit: null, automations: [], tasks: [] },
  { id: 'c2', name: 'Готово', position: 1, wipLimit: null, automations: [], tasks: [] },
];

function task(overrides: Partial<BoardTask> = {}): BoardTask {
  return {
    id: 't1',
    title: 'Task',
    description: null,
    priority: null,
    complexity: null,
    timeEstimateMinutes: null,
    actualMinutes: null,
    dueDate: null,
    assigneeId: null,
    assignee: null,
    position: 0,
    columnId: 'c1',
    recurrenceRule: 'NONE',
    recurrenceAction: 'DUPLICATE',
    recurrenceWeekdays: [],
    recurrenceOriginColumnId: null,
    overdueDays: 0,
    timerStartedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    customFields: [],
    tags: [],
    subtasks: [],
    isEpic: false,
    epicId: null,
    sprintId: null,
    ...overrides,
  };
}

describe('getAgingLevel', () => {
  const ref = new Date('2026-07-21T12:00:00');

  it('returns none without due date', () => {
    expect(getAgingLevel(task(), columns[0], columns, ref)).toBe('none');
  });

  it('returns due-today', () => {
    expect(
      getAgingLevel(task({ dueDate: '2026-07-21T00:00:00.000Z' }), columns[0], columns, ref),
    ).toBe('due-today');
  });

  it('returns due-soon within 48h', () => {
    expect(
      getAgingLevel(task({ dueDate: '2026-07-23T00:00:00.000Z' }), columns[0], columns, ref),
    ).toBe('due-soon');
  });

  it('returns overdue and overdue-critical', () => {
    expect(
      getAgingLevel(task({ dueDate: '2026-07-20T00:00:00.000Z' }), columns[0], columns, ref),
    ).toBe('overdue');
    expect(
      getAgingLevel(
        task({ dueDate: '2026-07-17T00:00:00.000Z', overdueDays: 4 }),
        columns[0],
        columns,
        ref,
      ),
    ).toBe('overdue-critical');
  });

  it('suppresses aging in done column', () => {
    expect(
      getAgingLevel(
        task({ dueDate: '2026-07-01T00:00:00.000Z', columnId: 'c2' }),
        columns[1],
        columns,
        ref,
      ),
    ).toBe('none');
  });
});
