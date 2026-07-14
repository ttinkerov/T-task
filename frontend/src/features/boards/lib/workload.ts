import type { BoardTask, BoardView } from '../types';

export interface WorkloadRow {
  id: string;
  name: string;
  planMinutes: number;
  actualMinutes: number;
  taskCount: number;
}

export interface TaskWithColumn extends BoardTask {
  columnName: string;
}

export type WorkloadPeriod = 'today' | 'week' | 'month' | 'all' | 'custom';

export interface WorkloadDateRange {
  from: Date | null;
  to: Date | null;
}

export function flattenBoardTasks(board: BoardView): TaskWithColumn[] {
  return board.columns.flatMap((column) =>
    column.tasks.map((task) => ({
      ...task,
      columnName: column.name,
    })),
  );
}

export function resolveWorkloadDateRange(
  period: WorkloadPeriod,
  customFrom = '',
  customTo = '',
): WorkloadDateRange {
  const today = startOfDay(new Date());

  if (period === 'all') {
    return { from: null, to: null };
  }

  if (period === 'today') {
    return { from: today, to: endOfDay(today) };
  }

  if (period === 'week') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from, to: endOfDay(today) };
  }

  if (period === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    return { from, to };
  }

  const from = customFrom ? startOfDay(new Date(`${customFrom}T00:00:00`)) : null;
  const to = customTo ? endOfDay(new Date(`${customTo}T00:00:00`)) : null;
  return { from, to };
}

export function filterTasksByDateRange(
  tasks: TaskWithColumn[],
  range: WorkloadDateRange,
): TaskWithColumn[] {
  if (!range.from && !range.to) {
    return tasks;
  }

  return tasks.filter((task) => {
    if (!task.dueDate) {
      return false;
    }

    const due = new Date(task.dueDate);
    if (range.from && due < range.from) {
      return false;
    }
    if (range.to && due > range.to) {
      return false;
    }

    return true;
  });
}

export function filterTasksByAssignee(
  tasks: TaskWithColumn[],
  assigneeId: string | '',
): TaskWithColumn[] {
  if (!assigneeId) {
    return tasks;
  }

  if (assigneeId === 'unassigned') {
    return tasks.filter((task) => !task.assigneeId);
  }

  return tasks.filter((task) => task.assigneeId === assigneeId);
}

export function buildWorkloadRows(tasks: TaskWithColumn[]): WorkloadRow[] {
  const relevantTasks = tasks.filter(
    (task) => (task.timeEstimateMinutes ?? 0) > 0 || (task.actualMinutes ?? 0) > 0,
  );

  const grouped = new Map<string, WorkloadRow>();

  for (const task of relevantTasks) {
    const assigneeId = task.assigneeId ?? 'unassigned';
    const name = task.assignee?.name ?? 'Без исполнителя';
    const current = grouped.get(assigneeId) ?? {
      id: assigneeId,
      name,
      planMinutes: 0,
      actualMinutes: 0,
      taskCount: 0,
    };

    grouped.set(assigneeId, {
      ...current,
      planMinutes: current.planMinutes + (task.timeEstimateMinutes ?? 0),
      actualMinutes: current.actualMinutes + (task.actualMinutes ?? 0),
      taskCount: current.taskCount + 1,
    });
  }

  return [...grouped.values()].sort((left, right) => right.planMinutes - left.planMinutes);
}

export function sumWorkload(rows: WorkloadRow[]) {
  return rows.reduce(
    (acc, row) => ({
      planMinutes: acc.planMinutes + row.planMinutes,
      actualMinutes: acc.actualMinutes + row.actualMinutes,
      taskCount: acc.taskCount + row.taskCount,
    }),
    { planMinutes: 0, actualMinutes: 0, taskCount: 0 },
  );
}

export function getPeriodLabel(period: WorkloadPeriod, customFrom = '', customTo = ''): string {
  switch (period) {
    case 'today':
      return 'сегодня';
    case 'week':
      return 'за 7 дней';
    case 'month':
      return 'за месяц';
    case 'all':
      return 'по всему проекту';
    case 'custom':
      if (customFrom && customTo) {
        return `${formatShortDate(customFrom)} — ${formatShortDate(customTo)}`;
      }
      if (customFrom) {
        return `с ${formatShortDate(customFrom)}`;
      }
      if (customTo) {
        return `до ${formatShortDate(customTo)}`;
      }
      return 'произвольный период';
  }
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatShortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}
