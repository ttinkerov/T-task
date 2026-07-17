export type BoardViewMode = 'BOARD' | 'LIST' | 'WEEK' | 'MONTH' | 'GANTT';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function toDateKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(value: Date, amount: number) {
  const next = startOfDay(value);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(value: Date) {
  const day = startOfDay(value);
  const mondayOffset = day.getDay() === 0 ? -6 : 1 - day.getDay();
  return addDays(day, mondayOffset);
}

export function buildWeekDays(anchor: Date) {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function buildMonthGrid(anchor: Date) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function getTimelinePlacement(
  task: { createdAt: string; dueDate: string | null },
  rangeStart: Date,
  rangeDays: number,
): { startIndex: number; span: number } | null {
  if (!task.dueDate || rangeDays < 1) return null;

  const first = startOfDay(rangeStart);
  const last = addDays(first, rangeDays - 1);
  const due = startOfDay(new Date(task.dueDate));
  const created = startOfDay(new Date(task.createdAt));
  const taskStart = created > due ? due : created;

  if (due < first || taskStart > last) return null;

  const visibleStart = taskStart < first ? first : taskStart;
  const visibleEnd = due > last ? last : due;
  const startIndex = Math.round((visibleStart.getTime() - first.getTime()) / DAY_MS);
  const span = Math.max(
    1,
    Math.round((visibleEnd.getTime() - visibleStart.getTime()) / DAY_MS) + 1,
  );

  return { startIndex, span };
}
