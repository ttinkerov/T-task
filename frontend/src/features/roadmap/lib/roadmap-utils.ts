import { addDays, startOfDay } from '../../boards/lib/task-view-utils';

const DAY_MS = 24 * 60 * 60 * 1000;

export type RoadmapDateSpan = {
  start: Date;
  end: Date;
};

export type RoadmapMonthColumn = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

export type RoadmapBarPlacement = {
  leftPct: number;
  widthPct: number;
};

export type RoadmapDatedTask = {
  createdAt: string;
  dueDate: string | null;
  sprintId?: string | null;
};

export type RoadmapSprintDates = {
  id: string;
  startDate: string;
  endDate: string;
};

export function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function addMonths(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

export function buildMonthColumns(rangeStart: Date, monthCount: number): RoadmapMonthColumn[] {
  const count = Math.max(1, Math.floor(monthCount));
  const first = startOfMonth(rangeStart);

  return Array.from({ length: count }, (_, index) => {
    const start = addMonths(first, index);
    const end = addDays(addMonths(start, 1), -1);
    const label = start.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    return { key, label, start: startOfDay(start), end: startOfDay(end) };
  });
}

export function getRangeEnd(rangeStart: Date, monthCount: number) {
  const columns = buildMonthColumns(rangeStart, monthCount);
  return columns[columns.length - 1]?.end ?? startOfDay(rangeStart);
}

function toDay(value: string | Date) {
  return startOfDay(typeof value === 'string' ? new Date(value) : value);
}

function minDate(dates: Date[]) {
  return dates.reduce((best, current) => (current < best ? current : best));
}

function maxDate(dates: Date[]) {
  return dates.reduce((best, current) => (current > best ? current : best));
}

export function getEpicSpan(
  epic: RoadmapDatedTask,
  children: RoadmapDatedTask[],
  sprintsById: Record<string, RoadmapSprintDates> = {},
): RoadmapDateSpan | null {
  const endCandidates: Date[] = [];
  const startCandidates: Date[] = [toDay(epic.createdAt)];

  if (epic.dueDate) {
    const due = toDay(epic.dueDate);
    endCandidates.push(due);
    startCandidates.push(due);
  }

  for (const child of children) {
    startCandidates.push(toDay(child.createdAt));
    if (child.dueDate) {
      const due = toDay(child.dueDate);
      endCandidates.push(due);
      startCandidates.push(due);
    }
  }

  const sprintIds = new Set<string>();
  if (epic.sprintId) sprintIds.add(epic.sprintId);
  for (const child of children) {
    if (child.sprintId) sprintIds.add(child.sprintId);
  }

  for (const sprintId of sprintIds) {
    const sprint = sprintsById[sprintId];
    if (!sprint) continue;
    const sprintStart = toDay(sprint.startDate);
    const sprintEnd = toDay(sprint.endDate);
    startCandidates.push(sprintStart);
    endCandidates.push(sprintEnd);
  }

  if (endCandidates.length === 0) return null;

  let start = minDate(startCandidates);
  const end = maxDate(endCandidates);
  if (start > end) {
    start = end;
  }

  return { start, end };
}

export function getBarPlacement(
  span: RoadmapDateSpan,
  rangeStart: Date,
  rangeEnd: Date,
): RoadmapBarPlacement | null {
  const first = startOfDay(rangeStart);
  const last = startOfDay(rangeEnd);
  if (last < first) return null;
  if (span.end < first || span.start > last) return null;

  const totalMs = Math.max(DAY_MS, last.getTime() - first.getTime() + DAY_MS);
  const visibleStart = span.start < first ? first : span.start;
  const visibleEnd = span.end > last ? last : span.end;
  const leftPct = ((visibleStart.getTime() - first.getTime()) / totalMs) * 100;
  const widthPct = Math.max(
    1.5,
    ((visibleEnd.getTime() - visibleStart.getTime() + DAY_MS) / totalMs) * 100,
  );

  return {
    leftPct: Math.max(0, Math.min(100, leftPct)),
    widthPct: Math.max(1.5, Math.min(100 - Math.max(0, leftPct), widthPct)),
  };
}

export function todayMarkerPct(rangeStart: Date, rangeEnd: Date, today = new Date()) {
  const first = startOfDay(rangeStart);
  const last = startOfDay(rangeEnd);
  const current = startOfDay(today);
  if (current < first || current > last) return null;

  const totalMs = Math.max(DAY_MS, last.getTime() - first.getTime() + DAY_MS);
  return ((current.getTime() - first.getTime()) / totalMs) * 100;
}

export function getEpicProgress(children: Array<{ completedAt: string | null }>) {
  const total = children.length;
  const done = children.filter((child) => Boolean(child.completedAt)).length;
  return { done, total };
}
