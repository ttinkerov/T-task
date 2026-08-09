'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useAllTasksQuery } from '@/features/all-tasks/hooks';
import DealTasksSectionView from '@/vue/crm/DealTasksSection.vue';
import { useDealTasksQuery, useLinkDealTaskMutation, useUnlinkDealTaskMutation } from '../hooks';

export function DealTasksSection({ workspaceId, dealId }: { workspaceId: string; dealId: string }) {
  const dealsQuery = useDealTasksQuery(workspaceId, dealId);
  const links = dealsQuery.data ?? [];
  const { data: allTasks } = useAllTasksQuery(workspaceId, {
    search: '',
    priority: '',
    assigneeId: '',
    boardId: '',
    columnId: '',
    tagId: '',
    status: 'OPEN',
    due: '',
    watching: false,
    page: 1,
    limit: 100,
    sortBy: 'UPDATED_AT',
    sortOrder: 'DESC',
  });
  const linkMutation = useLinkDealTaskMutation(workspaceId, dealId);
  const unlinkMutation = useUnlinkDealTaskMutation(workspaceId, dealId);

  const linkedIds = useMemo(() => new Set(links.map((link) => link.taskId)), [links]);

  const taskOptions = useMemo(
    () =>
      (allTasks?.items ?? [])
        .filter((task) => !linkedIds.has(task.id))
        .map((task) => ({
          id: task.id,
          label: `${task.title} · ${task.board.name}`,
        })),
    [allTasks?.items, linkedIds],
  );

  const linkRows = useMemo(
    () =>
      links.map((link) => ({
        taskId: link.taskId,
        title: link.task.title,
        meta: link.task.columnName,
        completed: link.task.completed,
      })),
    [links],
  );

  const onLink = useCallback((taskId: string) => linkMutation.mutateAsync(taskId), [linkMutation]);

  const onUnlink = useCallback(
    (taskId: string) => {
      unlinkMutation.mutate(taskId);
    },
    [unlinkMutation],
  );

  const onRetry = useCallback(() => {
    void dealsQuery.refetch();
  }, [dealsQuery]);

  const loadError = dealsQuery.isError
    ? dealsQuery.error instanceof Error
      ? dealsQuery.error.message
      : 'Не удалось загрузить задачи'
    : '';

  const viewProps = useMemo(
    () => ({
      links: linkRows,
      taskOptions,
      isLoading: dealsQuery.isLoading,
      loadError,
      linkPending: linkMutation.isPending,
      unlinkPending: unlinkMutation.isPending,
      error: (linkMutation.error ?? unlinkMutation.error)?.message ?? '',
      onLink,
      onUnlink,
      onRetry,
    }),
    [
      linkRows,
      taskOptions,
      dealsQuery.isLoading,
      loadError,
      linkMutation.isPending,
      linkMutation.error,
      unlinkMutation.isPending,
      unlinkMutation.error,
      onLink,
      onUnlink,
      onRetry,
    ],
  );

  return <VueIsland component={DealTasksSectionView} componentProps={viewProps} />;
}
