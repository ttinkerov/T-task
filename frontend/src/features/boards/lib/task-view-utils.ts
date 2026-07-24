export type BoardViewMode = 'BOARD' | 'TABLE' | 'CALENDAR' | 'TIMELINE';
export type CalendarRange = 'WEEK' | 'MONTH';

export const BOARD_VIEW_MODES: BoardViewMode[] = ['BOARD', 'TABLE', 'CALENDAR', 'TIMELINE'];
export const CALENDAR_RANGES: CalendarRange[] = ['WEEK', 'MONTH'];

const LEGACY_VIEW_MODE_MAP: Record<string, BoardViewMode> = {
  BOARD: 'BOARD',
  LIST: 'TABLE',
  TABLE: 'TABLE',
  WEEK: 'CALENDAR',
  MONTH: 'CALENDAR',
  CALENDAR: 'CALENDAR',
  GANTT: 'TIMELINE',
  TIMELINE: 'TIMELINE',
};

/** Maps current + legacy stored values onto the four product views. */
export function normalizeBoardViewMode(value: string | null | undefined): BoardViewMode | null {
  if (!value) return null;
  return LEGACY_VIEW_MODE_MAP[value] ?? null;
}

/** If the stored value was WEEK/MONTH, recover the calendar range. */
export function calendarRangeFromStoredView(
  value: string | null | undefined,
): CalendarRange | null {
  if (value === 'WEEK' || value === 'MONTH') return value;
  return null;
}

export function normalizeCalendarRange(value: string | null | undefined): CalendarRange | null {
  if (value === 'WEEK' || value === 'MONTH') return value;
  return null;
}

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
