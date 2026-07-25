import { describe, expect, it } from 'vitest';
import { findDoneColumn, findTask } from './board-lookup';
import type { BoardColumn, BoardView } from '../types';

function column(partial: Partial<BoardColumn> & Pick<BoardColumn, 'id' | 'name'>): BoardColumn {
  return {
    position: 0,
    wipLimit: null,
    taskTotal: 0,
    truncated: false,
    automations: [],
    tasks: [],
    ...partial,
  } as BoardColumn;
}

describe('findTask', () => {
  it('returns null for empty board', () => {
    expect(findTask(null, 'x')).toBeNull();
  });

  it('finds a task across columns', () => {
    const board = {
      columns: [
        column({
          id: 'c1',
          name: 'Todo',
          tasks: [{ id: 't1', title: 'A' } as BoardView['columns'][0]['tasks'][0]],
        }),
      ],
    } as BoardView;
    expect(findTask(board, 't1')?.id).toBe('t1');
  });
});

describe('findDoneColumn', () => {
  it('falls back to the last column by position', () => {
    const columns = [
      column({ id: 'a', name: 'Todo', position: 0 }),
      column({ id: 'b', name: 'Review', position: 1 }),
    ];
    expect(findDoneColumn(columns)?.id).toBe('b');
  });
});
