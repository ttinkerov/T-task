import { describe, expect, it } from 'vitest';
import { matchesFilters } from './board-task-filters';
import { EMPTY_BOARD_FILTERS, type BoardColumn, type BoardTask } from '../types';

const column = { id: 'c1', name: 'Todo', tasks: [] } as unknown as BoardColumn;
const task = {
  id: 't1',
  title: 'Hello world',
  description: 'desc',
  priority: 'HIGH',
  assigneeId: 'u1',
  tags: [{ id: 'tag1' }],
  sprintId: null,
  epicId: null,
  dueDate: null,
  completedAt: null,
} as unknown as BoardTask;

describe('matchesFilters', () => {
  it('matches empty filters', () => {
    expect(matchesFilters(task, column, [column], EMPTY_BOARD_FILTERS)).toBe(true);
  });

  it('filters by search', () => {
    expect(
      matchesFilters(task, column, [column], { ...EMPTY_BOARD_FILTERS, search: 'hello' }),
    ).toBe(true);
    expect(matchesFilters(task, column, [column], { ...EMPTY_BOARD_FILTERS, search: 'zzz' })).toBe(
      false,
    );
  });

  it('filters my tasks', () => {
    expect(
      matchesFilters(task, column, [column], { ...EMPTY_BOARD_FILTERS, myTasksOnly: true }, 'u1'),
    ).toBe(true);
    expect(
      matchesFilters(
        task,
        column,
        [column],
        { ...EMPTY_BOARD_FILTERS, myTasksOnly: true },
        'other',
      ),
    ).toBe(false);
  });
});
