'use client';

import { useCallback, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMembersQuery } from '@/features/workspaces/hooks';
import ColumnAutomationDialogView from '@/vue/boards/ColumnAutomationDialog.vue';
import { useUpdateColumnAutomationsMutation } from '../hooks';
import type { BoardColumn } from '../types';

export function ColumnAutomationDialog({
  workspaceId,
  boardId,
  column,
  onClose,
}: {
  workspaceId: string;
  boardId: string;
  column: BoardColumn;
  onClose: () => void;
}) {
  const titleId = useId();
  const membersQuery = useMembersQuery(workspaceId);
  const members = membersQuery.data ?? [];
  const updateMutation = useUpdateColumnAutomationsMutation(workspaceId, boardId);
  const assignAutomation = column.automations.find((item) => item.action === 'ASSIGN_USER');

  const onRetryMembers = useCallback(() => {
    void membersQuery.refetch();
  }, [membersQuery]);

  const membersLoadError = membersQuery.isError
    ? membersQuery.error instanceof Error
      ? membersQuery.error.message
      : 'Не удалось загрузить участников'
    : '';

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
      })),
    [members],
  );

  const onSave = useCallback(
    async (payload: {
      assignUserId: string | null;
      startTimer: boolean;
      completeTask: boolean;
    }) => {
      try {
        await updateMutation.mutateAsync({
          columnId: column.id,
          data: payload,
        });
        onClose();
      } catch {
        /* ignore */
      }
    },
    [column.id, onClose, updateMutation],
  );

  const viewProps = useMemo(
    () => ({
      titleId,
      columnName: column.name,
      members: memberOptions,
      initialAssignUserId: assignAutomation?.assigneeId ?? '',
      initialStartTimer: column.automations.some((item) => item.action === 'START_TIMER'),
      initialCompleteTask: column.automations.some((item) => item.action === 'COMPLETE_TASK'),
      pending: updateMutation.isPending,
      error: updateMutation.error?.message ?? '',
      membersLoadError,
      onSave,
      onClose,
      onRetryMembers,
    }),
    [
      titleId,
      column.name,
      column.automations,
      memberOptions,
      assignAutomation?.assigneeId,
      updateMutation.isPending,
      updateMutation.error?.message,
      membersLoadError,
      onSave,
      onClose,
      onRetryMembers,
    ],
  );

  return createPortal(
    <VueIsland component={ColumnAutomationDialogView} componentProps={viewProps} />,
    document.body,
  );
}
