'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import FormsList from '@/vue/forms/FormsList.vue';
import { useCreateFormMutation, useDeleteFormMutation, useFormsQuery } from '../hooks';

export function FormsListPage({ workspaceId }: { workspaceId: string }) {
  const { data: forms = [], isLoading, isError, error, refetch } = useFormsQuery(workspaceId);
  const createMutation = useCreateFormMutation(workspaceId);
  const deleteMutation = useDeleteFormMutation(workspaceId);
  const [createError, setCreateError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const onCreate = useCallback(
    async (title: string) => {
      setCreateError('');
      try {
        const created = await createMutation.mutateAsync(title);
        if (created?.id) {
          window.location.href = `/dashboard/forms/${created.id}`;
        }
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : 'Не удалось создать форму');
        throw err;
      }
    },
    [createMutation],
  );

  const onDelete = useCallback(
    async (formId: string) => {
      setDeleteError('');
      try {
        await deleteMutation.mutateAsync(formId);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить форму');
      }
    },
    [deleteMutation],
  );

  const listProps = useMemo(
    () => ({
      forms,
      isLoading,
      isError,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить формы'
        : '',
      createError,
      deleteError,
      isCreating: createMutation.isPending,
      isDeleting: deleteMutation.isPending,
      onRetryLoad: () => {
        void refetch();
      },
      onCreate,
      onDelete,
    }),
    [
      forms,
      isLoading,
      isError,
      error,
      createError,
      deleteError,
      createMutation.isPending,
      deleteMutation.isPending,
      refetch,
      onCreate,
      onDelete,
    ],
  );

  return <VueIsland component={FormsList} componentProps={listProps} />;
}
