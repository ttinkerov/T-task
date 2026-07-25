import { isTaskOverdue } from './overdue';
import type { BoardColumn, BoardFilters, BoardTask } from '../types';

export function matchesFilters(
  task: BoardTask,
  column: BoardColumn,
  columns: BoardColumn[],
  filters: BoardFilters,
  currentUserId?: string,
) {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (filters.priority && task.priority !== filters.priority) return false;

  if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;

  if (filters.tagId && !(task.tags ?? []).some((tag) => tag.id === filters.tagId)) return false;

  if (filters.myTasksOnly) {
    if (!currentUserId || task.assigneeId !== currentUserId) return false;
  }

  const overdue = isTaskOverdue(task, column, columns);
  if (filters.overdueStatus === 'overdue' && !overdue) return false;
  if (filters.overdueStatus === 'not_overdue' && overdue) return false;

  if (filters.sprintId && task.sprintId !== filters.sprintId) return false;
  if (filters.epicId && task.epicId !== filters.epicId) return false;

  return true;
}
