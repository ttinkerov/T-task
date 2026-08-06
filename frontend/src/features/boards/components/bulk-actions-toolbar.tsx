'use client';

import { useCallback, useMemo } from 'react';
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
  const { data: members = [] } = useMembersQuery(workspaceId);
  const { data: sprints = [] } = useSprintsQuery(workspaceId);
  const bulkMutation = useBulkUpdateTasksMutation(workspaceId, boardId);
  const count = selectedIds.size;

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
      try {
        await bulkMutation.mutateAsync({
          taskIds: [...selectedIds],
          ...patch,
        });
        onClear();
      } catch {
        /* ignore */
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
      error: bulkMutation.isError ? 'Не удалось применить изменения' : '',
      onApply,
      onClear,
    }),
    [
      count,
      memberOptions,
      sprintOptions,
      columnOptions,
      priorityOptions,
      bulkMutation.isPending,
      bulkMutation.isError,
      onApply,
      onClear,
    ],
  );

  if (count === 0) return null;

  return <VueIsland component={BulkActionsToolbarView} componentProps={viewProps} />;
}
