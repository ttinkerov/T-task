import type { BoardColumn, BoardTask } from '@/features/boards/types';

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isDoneColumn(column: BoardColumn, columns: BoardColumn[]): boolean {
  const maxPosition = Math.max(...columns.map((item) => item.position));
  const normalizedName = column.name.trim().toLowerCase();

  return (
    column.position === maxPosition ||
    normalizedName === 'готово' ||
    normalizedName === 'done' ||
    normalizedName === 'выполнено'
  );
}

export function countOverdueDays(dueDate: string, reference = new Date()): number {
  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(reference);
  const diffMs = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

export function isTaskOverdue(
  task: BoardTask,
  column: BoardColumn,
  columns: BoardColumn[],
  reference = new Date(),
): boolean {
  if (!task.dueDate || isDoneColumn(column, columns)) {
    return false;
  }

  return countOverdueDays(task.dueDate, reference) > 0;
}

export function formatOverdueLabel(
  task: BoardTask,
  column: BoardColumn,
  columns: BoardColumn[],
): string | null {
  if (!isTaskOverdue(task, column, columns)) {
    return task.overdueDays > 0 ? `Просрочено ${task.overdueDays} дн.` : null;
  }

  const days = Math.max(task.overdueDays, countOverdueDays(task.dueDate!));
  return days === 1 ? 'Просрочено 1 день' : `Просрочено ${days} дн.`;
}
