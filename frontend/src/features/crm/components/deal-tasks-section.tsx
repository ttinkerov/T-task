'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useAllTasksQuery } from '@/features/all-tasks/hooks';
import DealTasksSectionView from '@/vue/crm/DealTasksSection.vue';
import { useDealTasksQuery, useLinkDealTaskMutation, useUnlinkDealTaskMutation } from '../hooks';

export function DealTasksSection({ workspaceId, dealId }: { workspaceId: string; dealId: string }) {
  const { data: links = [], isLoading } = useDealTasksQuery(workspaceId, dealId);
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

  const viewProps = useMemo(
    () => ({
      links: linkRows,
      taskOptions,
      isLoading,
      linkPending: linkMutation.isPending,
      unlinkPending: unlinkMutation.isPending,
      error: (linkMutation.error ?? unlinkMutation.error)?.message ?? '',
      onLink,
      onUnlink,
    }),
    [
      linkRows,
      taskOptions,
      isLoading,
      linkMutation.isPending,
      linkMutation.error,
      unlinkMutation.isPending,
      unlinkMutation.error,
      onLink,
      onUnlink,
    ],
  );

  return <VueIsland component={DealTasksSectionView} componentProps={viewProps} />;
}
