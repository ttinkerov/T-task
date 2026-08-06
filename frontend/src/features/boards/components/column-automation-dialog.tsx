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
  const { data: members = [] } = useMembersQuery(workspaceId);
  const updateMutation = useUpdateColumnAutomationsMutation(workspaceId, boardId);
  const assignAutomation = column.automations.find((item) => item.action === 'ASSIGN_USER');

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
      onSave,
      onClose,
    }),
    [
      titleId,
      column.name,
      column.automations,
      memberOptions,
      assignAutomation?.assigneeId,
      updateMutation.isPending,
      updateMutation.error?.message,
      onSave,
      onClose,
    ],
  );

  return createPortal(
    <VueIsland component={ColumnAutomationDialogView} componentProps={viewProps} />,
    document.body,
  );
}
