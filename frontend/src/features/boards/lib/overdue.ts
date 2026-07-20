import type { BoardColumn, BoardTask } from '@/features/boards/types';

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export type AgingLevel = 'none' | 'due-soon' | 'due-today' | 'overdue' | 'overdue-critical';

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

export function getAgingLevel(
  task: BoardTask,
  column: BoardColumn,
  columns: BoardColumn[],
  reference = new Date(),
): AgingLevel {
  if (!task.dueDate || isDoneColumn(column, columns) || task.completedAt) {
    return 'none';
  }

  const due = startOfDay(new Date(task.dueDate));
  const today = startOfDay(reference);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    const overdueDays = Math.max(task.overdueDays, Math.abs(diffDays));
    return overdueDays >= 3 ? 'overdue-critical' : 'overdue';
  }

  if (diffDays === 0) return 'due-today';
  if (diffDays === 1 || diffDays === 2) return 'due-soon';
  return 'none';
}

export function formatAgingLabel(
  task: BoardTask,
  column: BoardColumn,
  columns: BoardColumn[],
  reference = new Date(),
): string | null {
  const level = getAgingLevel(task, column, columns, reference);
  if (level === 'due-today') return 'Сегодня';
  if (level === 'due-soon') return 'Скоро';
  return formatOverdueLabel(task, column, columns);
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
