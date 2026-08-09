'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useSprintsQuery } from '@/features/sprints';
import { useMembersQuery } from '@/features/workspaces/hooks';
import BulkActionsToolbarView from '@/vue/boards/BulkActionsToolbar.vue';
import { useBulkUpdateTasksMutation } from '../hooks';
import { PRIORITY_OPTIONS, type BoardColumn, type BulkUpdateTasksPayload } from '../types';

export function BulkActionsToolbar({
  workspaceId,
  boardId,
  columns,
  selectedIds,
  onClear,
}: {
  workspaceId: string;
  boardId: string;
  columns: BoardColumn[];
  selectedIds: Set<string>;
  onClear: () => void;
}) {
  const membersQuery = useMembersQuery(workspaceId);
  const sprintsQuery = useSprintsQuery(workspaceId);
  const members = membersQuery.data ?? [];
  const sprints = sprintsQuery.data ?? [];
  const bulkMutation = useBulkUpdateTasksMutation(workspaceId, boardId);
  const count = selectedIds.size;
  const [actionError, setActionError] = useState('');

  const onRetryLoad = useCallback(() => {
    void membersQuery.refetch();
    void sprintsQuery.refetch();
  }, [membersQuery, sprintsQuery]);

  const loadError =
    membersQuery.isError || sprintsQuery.isError
      ? membersQuery.error instanceof Error
        ? membersQuery.error.message
        : sprintsQuery.error instanceof Error
          ? sprintsQuery.error.message
          : 'Не удалось загрузить участников и спринты'
      : '';

  const memberOptions = useMemo(
    () => members.map((member) => ({ userId: member.userId, name: member.user.name })),
    [members],
  );

  const priorityOptions = useMemo(() => PRIORITY_OPTIONS.filter((option) => option.value), []);

  const columnOptions = useMemo(
    () => columns.map((column) => ({ id: column.id, name: column.name })),
    [columns],
  );

  const sprintOptions = useMemo(
    () => sprints.map((sprint) => ({ id: sprint.id, name: sprint.name })),
    [sprints],
  );

  const onApply = useCallback(
    async (patch: Omit<BulkUpdateTasksPayload, 'taskIds'>) => {
      setActionError('');
      try {
        await bulkMutation.mutateAsync({
          taskIds: [...selectedIds],
          ...patch,
        });
        onClear();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось применить изменения');
        throw err;
      }
    },
    [bulkMutation, onClear, selectedIds],
  );

  const viewProps = useMemo(
    () => ({
      count,
      members: memberOptions,
      sprints: sprintOptions,
      columns: columnOptions,
      priorityOptions,
      pending: bulkMutation.isPending,
      error: actionError,
      loadError,
      onApply,
      onClear,
      onRetry: onRetryLoad,
    }),
    [
      count,
      memberOptions,
      sprintOptions,
      columnOptions,
      priorityOptions,
      bulkMutation.isPending,
      actionError,
      loadError,
      onApply,
      onClear,
      onRetryLoad,
    ],
  );

  if (count === 0) return null;

  return <VueIsland component={BulkActionsToolbarView} componentProps={viewProps} />;
}
