import type { AllTask, MyTasksResult } from '../types';

export const HOME_SECTION_LIMIT = 5;

export type HomeDashboardSlices = {
  overdue: AllTask[];
  nextActions: AllTask[];
  recent: AllTask[];
  counts: {
    overdue: number;
    dueSoon: number;
    assigned: number;
    open: number;
  };
};

/**
 * Build home dashboard lists from my-tasks buckets + optional recently updated tasks.
 * Next actions = due soon first, then other assigned (no duplicates).
 */
export function buildHomeDashboardSlices(
  myTasks: Pick<MyTasksResult, 'overdue' | 'dueSoon' | 'assigned' | 'watching'>,
  recentCandidates: AllTask[] = [],
  limit = HOME_SECTION_LIMIT,
): HomeDashboardSlices {
  const overdue = myTasks.overdue.slice(0, limit);

  const nextSeen = new Set<string>();
  const nextActions: AllTask[] = [];
  for (const task of [...myTasks.dueSoon, ...myTasks.assigned]) {
    if (nextSeen.has(task.id)) continue;
    nextSeen.add(task.id);
    nextActions.push(task);
    if (nextActions.length >= limit) break;
  }

  const recentSeen = new Set<string>();
  const recent: AllTask[] = [];
  const recentSource =
    recentCandidates.length > 0
      ? recentCandidates
      : [...myTasks.overdue, ...myTasks.dueSoon, ...myTasks.assigned, ...myTasks.watching].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

  for (const task of recentSource) {
    if (recentSeen.has(task.id)) continue;
    recentSeen.add(task.id);
    recent.push(task);
    if (recent.length >= limit) break;
  }

  return {
    overdue,
    nextActions,
    recent,
    counts: {
      overdue: myTasks.overdue.length,
      dueSoon: myTasks.dueSoon.length,
      assigned: myTasks.assigned.length,
      open:
        myTasks.overdue.length +
        myTasks.dueSoon.length +
        myTasks.assigned.length +
        myTasks.watching.length,
    },
  };
}
