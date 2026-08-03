'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import CustomFieldCreateForm from '@/vue/custom-fields/CustomFieldCreateForm.vue';
import CustomFieldList from '@/vue/custom-fields/CustomFieldList.vue';
import {
  useCreateCustomFieldMutation,
  useCustomFieldsQuery,
  useDeleteCustomFieldMutation,
  useUpdateCustomFieldMutation,
} from '../hooks';
import {
  CHOICE_FIELD_TYPES,
  CUSTOM_FIELD_TYPE_LABELS,
  CUSTOM_FIELD_TYPE_OPTIONS,
  type CustomFieldType,
} from '../types';

interface CustomFieldsPageProps {
  workspaceId: string;
}

export function CustomFieldsPage({ workspaceId }: CustomFieldsPageProps) {
  const { data: session } = useMeQuery();
  const fieldsQuery = useCustomFieldsQuery(workspaceId);
  const createMutation = useCreateCustomFieldMutation(workspaceId);
  const updateMutation = useUpdateCustomFieldMutation(workspaceId);
  const deleteMutation = useDeleteCustomFieldMutation(workspaceId);

  const [pendingId, setPendingId] = useState<string | null>(null);

  const role = session?.workspaces.find((workspace) => workspace.id === workspaceId)?.role;
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';

  const fields = fieldsQuery.data ?? [];

  const onCreate = useCallback(
    async (payload: {
      name: string;
      type: CustomFieldType;
      options?: string[];
      showOnCard?: boolean;
    }) => {
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  const onToggleCard = useCallback(
    async (payload: { fieldId: string; showOnCard: boolean }) => {
      setPendingId(payload.fieldId);
      try {
        await updateMutation.mutateAsync({
          fieldId: payload.fieldId,
          data: { showOnCard: payload.showOnCard },
        });
      } catch {
        /* ignore */
      } finally {
        setPendingId(null);
      }
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    async (fieldId: string) => {
      setPendingId(fieldId);
      try {
        await deleteMutation.mutateAsync(fieldId);
      } catch {
        /* ignore */
      } finally {
        setPendingId(null);
      }
    },
    [deleteMutation],
  );

  const listProps = useMemo(
    () => ({
      fields,
      isLoading: fieldsQuery.isLoading,
      isError: Boolean(fieldsQuery.error),
      canManage,
      pendingId,
      typeLabels: CUSTOM_FIELD_TYPE_LABELS,
      onToggleCard,
      onDelete,
    }),
    [
      fields,
      fieldsQuery.isLoading,
      fieldsQuery.error,
      canManage,
      pendingId,
      onToggleCard,
      onDelete,
    ],
  );

  const formProps = useMemo(
    () => ({
      typeOptions: CUSTOM_FIELD_TYPE_OPTIONS,
      choiceTypes: CHOICE_FIELD_TYPES,
      isCreating: createMutation.isPending,
      errorMessage: createMutation.error?.message ?? '',
      onCreate,
    }),
    [createMutation.isPending, createMutation.error, onCreate],
  );

  return (
    <div className="custom-fields-page">
      <header className="custom-fields-page__header">
        <h1>Кастомные поля</h1>
        <p>
          Создавай собственные поля в задачах под процессы команды: бюджеты, ссылки, статусы,
          ответственных или метки. Значения полей можно вынести на карточки задач.
        </p>
      </header>

      <VueIsland component={CustomFieldList} componentProps={listProps} />

      {canManage ? (
        <VueIsland component={CustomFieldCreateForm} componentProps={formProps} />
      ) : null}
    </div>
  );
}
