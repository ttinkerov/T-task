'use client';

import { useCallback, useMemo } from 'react';
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
  const { data: members = [] } = useMembersQuery(workspaceId);
  const { data: watchState } = useTaskWatchersQuery(workspaceId, taskId);
  const toggleWatchMutation = useToggleWatchMutation(workspaceId, taskId);

  const onToggleWatch = useCallback(() => {
    void toggleWatchMutation.mutateAsync(Boolean(watchState?.watching));
  }, [toggleWatchMutation, watchState?.watching]);

  const viewProps = useMemo(
    () => ({
      assigneeId,
      members,
      watching: Boolean(watchState?.watching),
      watchersLabel: watchState?.watchers?.length
        ? watchState.watchers.map((item) => item.name).join(', ')
        : '',
      togglePending: toggleWatchMutation.isPending,
      onAssigneeChange,
      onToggleWatch,
    }),
    [
      assigneeId,
      members,
      watchState?.watching,
      watchState?.watchers,
      toggleWatchMutation.isPending,
      onAssigneeChange,
      onToggleWatch,
    ],
  );

  return <VueIsland component={TaskAssigneeWatchFieldsView} componentProps={viewProps} />;
}
