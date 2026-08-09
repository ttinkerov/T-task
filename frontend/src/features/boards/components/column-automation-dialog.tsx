'use client';

import { useCallback, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import { useCustomFieldsQuery } from '@/features/custom-fields/hooks';
import { useMembersQuery } from '@/features/workspaces/hooks';
import ColumnAutomationDialogView from '@/vue/boards/ColumnAutomationDialog.vue';
import { useUpdateColumnAutomationsMutation } from '../hooks';
import type { BoardColumn, ColumnAutomationConfig } from '../types';

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
  const fieldsQuery = useCustomFieldsQuery(workspaceId);
  const members = membersQuery.data ?? [];
  const fields = fieldsQuery.data ?? [];
  const updateMutation = useUpdateColumnAutomationsMutation(workspaceId, boardId);
  const assignAutomation = column.automations.find((item) => item.action === 'ASSIGN_USER');
  const notifyAutomation = column.automations.find((item) => item.action === 'NOTIFY_WATCHERS');
  const fieldAutomation = column.automations.find((item) => item.action === 'SET_CUSTOM_FIELD');
  const webhookAutomation = column.automations.find((item) => item.action === 'WEBHOOK');
  const fieldConfig = (fieldAutomation?.config ?? null) as ColumnAutomationConfig | null;
  const notifyConfig = (notifyAutomation?.config ?? null) as ColumnAutomationConfig | null;
  const webhookConfig = (webhookAutomation?.config ?? null) as ColumnAutomationConfig | null;

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

  const fieldOptions = useMemo(
    () => fields.map((field) => ({ id: field.id, name: field.name, type: field.type })),
    [fields],
  );

  const onSave = useCallback(
    async (payload: {
      assignUserId: string | null;
      startTimer: boolean;
      completeTask: boolean;
      notifyWatchers: boolean;
      notifyMessage: string;
      customFieldId: string | null;
      customFieldValue: string;
      webhookUrl: string;
    }) => {
      try {
        await updateMutation.mutateAsync({
          columnId: column.id,
          data: {
            assignUserId: payload.assignUserId,
            startTimer: payload.startTimer,
            completeTask: payload.completeTask,
            notifyWatchers: payload.notifyWatchers,
            notifyMessage: payload.notifyMessage.trim() || null,
            customFieldId: payload.customFieldId,
            customFieldValue: payload.customFieldValue.trim() || null,
            webhookUrl: payload.webhookUrl.trim() || null,
          },
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
      fields: fieldOptions,
      initialAssignUserId: assignAutomation?.assigneeId ?? '',
      initialStartTimer: column.automations.some((item) => item.action === 'START_TIMER'),
      initialCompleteTask: column.automations.some((item) => item.action === 'COMPLETE_TASK'),
      initialNotifyWatchers: Boolean(notifyAutomation),
      initialNotifyMessage: notifyConfig?.message ?? '',
      initialCustomFieldId: fieldConfig?.fieldId ?? '',
      initialCustomFieldValue: fieldConfig?.value == null ? '' : String(fieldConfig.value),
      initialWebhookUrl: webhookConfig?.url ?? '',
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
      fieldOptions,
      assignAutomation?.assigneeId,
      notifyAutomation,
      notifyConfig?.message,
      fieldConfig?.fieldId,
      fieldConfig?.value,
      webhookConfig?.url,
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
