import { findTask } from './board-lookup';
import type { BoardView } from '../types';

export type DragType = 'column' | 'task';

export function resolveDropTarget(board: BoardView, overId: string, taskId: string) {
  const columnMatch = board.columns.find((column) => column.id === overId);
  if (columnMatch) {
    const activeTask = findTask(board, taskId);
    if (activeTask?.columnId === columnMatch.id) {
      return { columnId: columnMatch.id, position: Math.max(0, columnMatch.tasks.length - 1) };
    }
    return { columnId: columnMatch.id, position: columnMatch.tasks.length };
  }

  const overTask = findTask(board, overId);
  if (!overTask) return null;

  const column = board.columns.find((item) => item.id === overTask.columnId);
  if (!column) return null;

  const overIndex = column.tasks.findIndex((item) => item.id === overId);
  const activeTask = findTask(board, taskId);
  if (!activeTask) return null;

  if (activeTask.columnId === column.id && overIndex > activeTask.position) {
    return { columnId: column.id, position: overIndex };
  }

  return { columnId: column.id, position: overIndex };
}
