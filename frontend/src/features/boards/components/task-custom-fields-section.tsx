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
  const { data: members = [] } = useMembersQuery(workspaceId);
  const setValueMutation = useSetTaskCustomFieldMutation(workspaceId, taskId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const definitions = fieldsQuery.data ?? [];

  const onSave = useCallback(
    async (fieldId: string, value: CustomFieldValue) => {
      setPendingId(fieldId);
      try {
        await setValueMutation.mutateAsync({ fieldId, value });
      } catch {
        /* ignore */
      } finally {
        setPendingId(null);
      }
    },
    [setValueMutation],
  );

  const viewProps = useMemo(
    () => ({
      definitions,
      values,
      members,
      isLoading: fieldsQuery.isLoading,
      pendingId,
      error: setValueMutation.error?.message ?? '',
      onSave,
    }),
    [
      definitions,
      values,
      members,
      fieldsQuery.isLoading,
      pendingId,
      setValueMutation.error?.message,
      onSave,
    ],
  );

  if (!fieldsQuery.isLoading && definitions.length === 0) {
    return null;
  }

  return <VueIsland component={TaskCustomFieldsSectionView} componentProps={viewProps} />;
}
