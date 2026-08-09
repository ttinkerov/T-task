'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { useTaskWatchersQuery, useToggleWatchMutation } from '@/features/watchers/hooks';
import TaskAssigneeWatchFieldsView from '@/vue/boards/TaskAssigneeWatchFields.vue';

export function TaskAssigneeWatchFields({
  workspaceId,
  taskId,
  assigneeId,
  onAssigneeChange,
}: {
  workspaceId: string;
  taskId: string;
  assigneeId: string;
  onAssigneeChange: (id: string) => void;
}) {
  const membersQuery = useMembersQuery(workspaceId);
  const watchersQuery = useTaskWatchersQuery(workspaceId, taskId);
  const members = membersQuery.data ?? [];
  const watchState = watchersQuery.data;
  const toggleWatchMutation = useToggleWatchMutation(workspaceId, taskId);
  const [actionError, setActionError] = useState('');

  const onToggleWatch = useCallback(async () => {
    setActionError('');
    try {
      await toggleWatchMutation.mutateAsync(Boolean(watchState?.watching));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось изменить подписку');
    }
  }, [toggleWatchMutation, watchState?.watching]);

  const onRetry = useCallback(() => {
    void membersQuery.refetch();
    void watchersQuery.refetch();
  }, [membersQuery, watchersQuery]);

  const loadError =
    membersQuery.isError || watchersQuery.isError
      ? membersQuery.error instanceof Error
        ? membersQuery.error.message
        : watchersQuery.error instanceof Error
          ? watchersQuery.error.message
          : 'Не удалось загрузить участников'
      : '';

  const viewProps = useMemo(
    () => ({
      assigneeId,
      members,
      watching: Boolean(watchState?.watching),
      watchersLabel: watchState?.watchers?.length
        ? watchState.watchers.map((item) => item.name).join(', ')
        : '',
      togglePending: toggleWatchMutation.isPending,
      loadError,
      actionError,
      onAssigneeChange,
      onToggleWatch,
      onRetry,
    }),
    [
      assigneeId,
      members,
      watchState?.watching,
      watchState?.watchers,
      toggleWatchMutation.isPending,
      loadError,
      actionError,
      onAssigneeChange,
      onToggleWatch,
      onRetry,
    ],
  );

  return <VueIsland component={TaskAssigneeWatchFieldsView} componentProps={viewProps} />;
}
