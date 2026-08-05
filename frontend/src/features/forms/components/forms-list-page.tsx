'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import FormsList from '@/vue/forms/FormsList.vue';
import { useCreateFormMutation, useDeleteFormMutation, useFormsQuery } from '../hooks';

export function FormsListPage({ workspaceId }: { workspaceId: string }) {
  const { data: forms = [], isLoading } = useFormsQuery(workspaceId);
  const createMutation = useCreateFormMutation(workspaceId);
  const deleteMutation = useDeleteFormMutation(workspaceId);

  const onCreate = useCallback(
    async (title: string) => {
      const created = await createMutation.mutateAsync(title);
      if (created?.id) {
        window.location.href = `/dashboard/forms/${created.id}`;
      }
    },
    [createMutation],
  );

  const onDelete = useCallback(
    (formId: string) => {
      void deleteMutation.mutateAsync(formId);
    },
    [deleteMutation],
  );

  const listProps = useMemo(
    () => ({
      forms,
      isLoading,
      isCreating: createMutation.isPending,
      isDeleting: deleteMutation.isPending,
      onCreate,
      onDelete,
    }),
    [forms, isLoading, createMutation.isPending, deleteMutation.isPending, onCreate, onDelete],
  );

  return <VueIsland component={FormsList} componentProps={listProps} />;
}
