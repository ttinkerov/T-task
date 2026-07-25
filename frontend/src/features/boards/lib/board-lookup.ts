import { isDoneColumn } from './overdue';
import type { BoardColumn, BoardView } from '../types';

export function findTask(board: BoardView | null | undefined, taskId: string) {
  if (!board) return null;
  for (const column of board.columns) {
    const task = column.tasks.find((item) => item.id === taskId);
    if (task) return task;
  }
  return null;
}

export function findDoneColumn(columns: BoardColumn[]) {
  return (
    columns.find((column) => isDoneColumn(column, columns)) ?? columns[columns.length - 1] ?? null
  );
}
