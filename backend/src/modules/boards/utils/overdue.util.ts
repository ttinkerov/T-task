import { addDays, startOfDay } from './date.util';

export function isDoneColumn(
  column: { name: string; position: number },
  columns: { position: number }[],
): boolean {
  const maxPosition = Math.max(...columns.map((item) => item.position));
  const normalizedName = column.name.trim().toLowerCase();

  return (
    column.position === maxPosition ||
    normalizedName === 'готово' ||
    normalizedName === 'done' ||
    normalizedName === 'выполнено'
  );
}

export function countOverdueDays(dueDate: Date, reference = new Date()): number {
  const due = startOfDay(dueDate);
  const today = startOfDay(reference);
  const diffMs = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  return Math.max(0, diffDays);
}

export function isTaskOverdue(
  task: { dueDate: Date | null },
  column: { name: string; position: number },
  columns: { position: number }[],
  reference = new Date(),
): boolean {
  if (!task.dueDate || isDoneColumn(column, columns)) {
    return false;
  }

  return countOverdueDays(task.dueDate, reference) > 0;
}

export function nextRolledDueDate(reference = new Date()): Date {
  return addDays(startOfDay(reference), 1);
}
