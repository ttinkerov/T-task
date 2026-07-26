export const DUE_SOON_DAYS = 7;

export type MyTasksSectionId = 'overdue' | 'dueSoon' | 'assigned' | 'watching';

export type MyTasksBucketTask = {
  id: string;
  dueDate: string | null;
  completedAt?: string | null;
};

export type MyTasksBuckets<T extends MyTasksBucketTask> = {
  overdue: T[];
  dueSoon: T[];
  assigned: T[];
  watching: T[];
};

export function partitionMyTasks<T extends MyTasksBucketTask>(
  assignedTasks: T[],
  watchingTasks: T[],
  now: Date = new Date(),
): MyTasksBuckets<T> {
  const dueSoonEnd = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);
  const nowMs = startOfDay(now).getTime();

  const overdue: T[] = [];
  const dueSoon: T[] = [];
  const assigned: T[] = [];
  const seen = new Set<string>();

  for (const task of assignedTasks) {
    if (task.completedAt) continue;
    seen.add(task.id);
    const dueMs = task.dueDate ? new Date(task.dueDate).getTime() : null;
    if (dueMs !== null && !Number.isNaN(dueMs) && dueMs < nowMs) {
      overdue.push(task);
      continue;
    }
    if (dueMs !== null && !Number.isNaN(dueMs) && dueMs >= nowMs && dueMs <= dueSoonEnd.getTime()) {
      dueSoon.push(task);
      continue;
    }
    assigned.push(task);
  }

  const watching = watchingTasks.filter((task) => !task.completedAt && !seen.has(task.id));

  return { overdue, dueSoon, assigned, watching };
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
