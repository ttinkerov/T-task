'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { PRIORITY_LABELS } from '@/features/boards/types';
import MyTasksPageView from '@/vue/all-tasks/MyTasksPageView.vue';
import { useMyTasksQuery } from '../hooks';
import { DUE_SOON_DAYS } from '../lib/my-tasks-partition';
import type { AllTask } from '../types';

const TaskDetailDrawer = dynamic(
  () =>
    import('@/features/boards/components/task-detail-drawer').then((mod) => ({
      default: mod.TaskDetailDrawer,
    })),
  { ssr: false },
);

const SECTION_LIMIT = 50;

export function MyTasksPage({
  workspaceId,
  userId: _userId,
  initialTaskId = null,
  initialSection = 'all',
}: {
  workspaceId: string;
  userId: string;
  initialTaskId?: string | null;
  initialSection?: string | null;
}) {
  const myTasks = useMyTasksQuery(workspaceId, SECTION_LIMIT);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);

  const buckets = myTasks.data ?? {
    overdue: [] as AllTask[],
    dueSoon: [] as AllTask[],
    assigned: [] as AllTask[],
    watching: [] as AllTask[],
  };
  const dueSoonDays = myTasks.data?.dueSoonDays ?? DUE_SOON_DAYS;

  const allTasksById = useMemo(() => {
    const map = new Map<string, AllTask>();
    for (const task of [
      ...buckets.overdue,
      ...buckets.dueSoon,
      ...buckets.assigned,
      ...buckets.watching,
    ]) {
      map.set(task.id, task);
    }
    return map;
  }, [buckets.assigned, buckets.dueSoon, buckets.overdue, buckets.watching]);

  const selectedTask = selectedTaskId ? (allTasksById.get(selectedTaskId) ?? null) : null;
  const relationCandidates = useMemo(
    () =>
      Array.from(allTasksById.values()).map((task) => ({
        id: task.id,
        title: task.title,
        columnName: `${task.board.name} · ${task.column.name}`,
        completed: Boolean(task.completedAt),
        isEpic: Boolean(task.isEpic),
      })),
    [allTasksById],
  );

  const totalVisible =
    buckets.overdue.length +
    buckets.dueSoon.length +
    buckets.assigned.length +
    buckets.watching.length;

  const onOpenTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const listProps = useMemo(
    () => ({
      dueSoonDays,
      totalVisible,
      isLoading: myTasks.isLoading,
      isError: myTasks.isError,
      overdue: buckets.overdue,
      dueSoon: buckets.dueSoon,
      assigned: buckets.assigned,
      watching: buckets.watching,
      priorityLabels: PRIORITY_LABELS,
      initialSection: initialSection ?? 'all',
      onOpenTask,
      onRetry: () => {
        void myTasks.refetch();
      },
    }),
    [
      dueSoonDays,
      totalVisible,
      myTasks.isLoading,
      myTasks.isError,
      myTasks.refetch,
      buckets.overdue,
      buckets.dueSoon,
      buckets.assigned,
      buckets.watching,
      initialSection,
      onOpenTask,
    ],
  );

  return (
    <section className="all-tasks my-tasks" aria-labelledby="my-tasks-title">
      <VueIsland component={MyTasksPageView} componentProps={listProps} />

      {selectedTask ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={`${selectedTask.board.name} · ${selectedTask.column.name}`}
          relationCandidates={relationCandidates}
          linkSource="my-tasks"
          onOpenTask={setSelectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </section>
  );
}
