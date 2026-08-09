'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import { EMPTY_ALL_TASKS_FILTERS, useAllTasksQuery, useMyTasksQuery } from '@/features/all-tasks';
import {
  buildHomeDashboardSlices,
  HOME_SECTION_LIMIT,
} from '@/features/all-tasks/lib/home-dashboard-slices';
import { DUE_SOON_DAYS } from '@/features/all-tasks/lib/my-tasks-partition';
import type { AllTask, AllTasksQuery } from '@/features/all-tasks/types';
import { PRIORITY_LABELS } from '@/features/boards/types';
import { useCreateWorkspaceMutation, useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import HomeDashboardView from '@/vue/auth/HomeDashboardView.vue';

const TaskDetailDrawer = dynamic(
  () =>
    import('@/features/boards/components/task-detail-drawer').then((mod) => ({
      default: mod.TaskDetailDrawer,
    })),
  { ssr: false },
);

const QUICK_LINKS = [
  { href: '/dashboard/board', label: 'Доска' },
  { href: '/dashboard/my-tasks', label: 'Мои задачи' },
  { href: '/dashboard/crm', label: 'CRM' },
  { href: '/dashboard/focus', label: 'Фокус' },
  { href: '/dashboard/forms', label: 'Формы' },
  { href: '/dashboard/analytics', label: 'Аналитика' },
] as const;

export function DashboardContent() {
  const { data: session } = useMeQuery();
  const { data: workspaces = [] } = useWorkspacesQuery();
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);
  const createMutation = useCreateWorkspaceMutation();
  const currentWorkspace = workspaces.find((workspace) => workspace.id === currentWorkspaceId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const myTasksQuery = useMyTasksQuery(currentWorkspaceId, 50);

  const recentQueryParams = useMemo<AllTasksQuery>(
    () => ({
      ...EMPTY_ALL_TASKS_FILTERS,
      assigneeId: session?.user.id ?? '',
      status: 'OPEN',
      page: 1,
      limit: HOME_SECTION_LIMIT,
      sortBy: 'UPDATED_AT',
      sortOrder: 'DESC',
    }),
    [session?.user.id],
  );

  const recentQuery = useAllTasksQuery(
    session?.user.id && currentWorkspaceId ? currentWorkspaceId : null,
    recentQueryParams,
  );

  const buckets = myTasksQuery.data ?? {
    overdue: [] as AllTask[],
    dueSoon: [] as AllTask[],
    assigned: [] as AllTask[],
    watching: [] as AllTask[],
  };
  const dueSoonDays = myTasksQuery.data?.dueSoonDays ?? DUE_SOON_DAYS;

  const slices = useMemo(
    () => buildHomeDashboardSlices(buckets, recentQuery.data?.items ?? [], HOME_SECTION_LIMIT),
    [buckets, recentQuery.data?.items],
  );

  const tasksById = useMemo(() => {
    const map = new Map<string, AllTask>();
    for (const task of [
      ...buckets.overdue,
      ...buckets.dueSoon,
      ...buckets.assigned,
      ...buckets.watching,
      ...(recentQuery.data?.items ?? []),
    ]) {
      map.set(task.id, task);
    }
    return map;
  }, [buckets, recentQuery.data?.items]);

  const selectedTask = selectedTaskId ? (tasksById.get(selectedTaskId) ?? null) : null;
  const relationCandidates = useMemo(
    () =>
      Array.from(tasksById.values()).map((task) => ({
        id: task.id,
        title: task.title,
        columnName: `${task.board.name} · ${task.column.name}`,
        completed: Boolean(task.completedAt),
        isEpic: Boolean(task.isEpic),
      })),
    [tasksById],
  );

  useEffect(() => {
    if (!workspaces.length) return;
    const exists = workspaces.some((workspace) => workspace.id === currentWorkspaceId);
    if (!currentWorkspaceId || !exists) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [currentWorkspaceId, setCurrentWorkspaceId, workspaces]);

  const onCreateWorkspace = useCallback(
    async (payload: { name: string }) => {
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  const viewProps = useMemo(
    () => ({
      userName: session?.user.name ?? '',
      hasWorkspace: Boolean(currentWorkspaceId),
      isLoading: myTasksQuery.isLoading,
      isError: myTasksQuery.isError,
      dueSoonDays,
      counts: slices.counts,
      sections: [
        {
          id: 'home-overdue',
          title: 'Просроченные',
          hint: 'Дедлайн уже прошёл',
          tasks: slices.overdue,
          count: slices.counts.overdue,
          tone: 'danger',
          emptyLabel: 'Просрочек нет — отличная работа.',
        },
        {
          id: 'home-next',
          title: 'Дальше',
          hint: 'Скоро дедлайн и назначенные вам',
          tasks: slices.nextActions,
          count: slices.counts.dueSoon + slices.counts.assigned,
          tone: 'warn',
          emptyLabel: 'Нет ближайших действий — возьмите задачу с доски.',
        },
        {
          id: 'home-recent',
          title: 'Недавние',
          hint: 'Недавно обновлённые',
          tasks: slices.recent,
          emptyLabel: 'Пока нет недавних задач.',
        },
      ],
      quickLinks: [...QUICK_LINKS],
      workspaces: workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: workspace.role,
        settingsHref: `/dashboard/workspaces/${workspace.id}/settings`,
      })),
      switcherWorkspaces: workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
      })),
      currentWorkspaceId: currentWorkspaceId ?? '',
      currentWorkspaceRole: currentWorkspace?.role ?? '',
      createPending: createMutation.isPending,
      priorityLabels: PRIORITY_LABELS,
      onOpenTask: setSelectedTaskId,
      onWorkspaceChange: setCurrentWorkspaceId,
      onCreateWorkspace,
      onRetry: () => {
        void myTasksQuery.refetch();
      },
    }),
    [
      session?.user.name,
      currentWorkspaceId,
      myTasksQuery.isLoading,
      myTasksQuery.isError,
      myTasksQuery.refetch,
      dueSoonDays,
      slices,
      workspaces,
      currentWorkspace?.role,
      createMutation.isPending,
      onCreateWorkspace,
      setCurrentWorkspaceId,
    ],
  );

  if (!session) {
    return null;
  }

  return (
    <>
      <VueIsland component={HomeDashboardView} componentProps={viewProps} />
      {selectedTask && currentWorkspaceId ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={currentWorkspaceId}
          task={selectedTask}
          columnName={`${selectedTask.board.name} · ${selectedTask.column.name}`}
          relationCandidates={relationCandidates}
          linkSource="my-tasks"
          onOpenTask={setSelectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </>
  );
}
