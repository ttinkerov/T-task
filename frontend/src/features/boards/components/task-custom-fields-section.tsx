'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import {
  useCustomFieldsQuery,
  useSetTaskCustomFieldMutation,
} from '@/features/custom-fields/hooks';
import type { CustomFieldValue } from '@/features/custom-fields/types';
import { useMembersQuery } from '@/features/workspaces/hooks';
import TaskCustomFieldsSectionView from '@/vue/boards/TaskCustomFieldsSection.vue';
import type { TaskCustomFieldValue } from '../types';

interface TaskCustomFieldsSectionProps {
  workspaceId: string;
  taskId: string;
  values: TaskCustomFieldValue[];
}

export function TaskCustomFieldsSection({
  workspaceId,
  taskId,
  values,
}: TaskCustomFieldsSectionProps) {
  const fieldsQuery = useCustomFieldsQuery(workspaceId);
  const membersQuery = useMembersQuery(workspaceId);
  const members = membersQuery.data ?? [];
  const setValueMutation = useSetTaskCustomFieldMutation(workspaceId, taskId);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const definitions = fieldsQuery.data ?? [];
  const loadError =
    fieldsQuery.isError || membersQuery.isError
      ? fieldsQuery.isError
        ? fieldsQuery.error instanceof Error
          ? fieldsQuery.error.message
          : 'Не удалось загрузить поля'
        : membersQuery.error instanceof Error
          ? membersQuery.error.message
          : 'Не удалось загрузить участников'
      : '';

  const onSave = useCallback(
    async (fieldId: string, value: CustomFieldValue) => {
      setPendingId(fieldId);
      setActionError('');
      try {
        await setValueMutation.mutateAsync({ fieldId, value });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось сохранить поле');
      } finally {
        setPendingId(null);
      }
    },
    [setValueMutation],
  );

  const onRetryLoad = useCallback(() => {
    void fieldsQuery.refetch();
    void membersQuery.refetch();
  }, [fieldsQuery, membersQuery]);

  const viewProps = useMemo(
    () => ({
      definitions,
      values,
      members,
      isLoading: fieldsQuery.isLoading,
      loadError,
      pendingId,
      error: actionError || setValueMutation.error?.message || '',
      onSave,
      onRetryLoad,
    }),
    [
      definitions,
      values,
      members,
      fieldsQuery.isLoading,
      loadError,
      pendingId,
      actionError,
      setValueMutation.error?.message,
      onSave,
      onRetryLoad,
    ],
  );

  if (!fieldsQuery.isLoading && !loadError && definitions.length === 0) {
    return null;
  }

  return <VueIsland component={TaskCustomFieldsSectionView} componentProps={viewProps} />;
}
