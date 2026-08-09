'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskChecklistSectionView from '@/vue/boards/TaskChecklistSection.vue';
import {
  useApplyDodTemplateMutation,
  useCreateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useDodTemplatesQuery,
  useTaskChecklistQuery,
  useUpdateChecklistItemMutation,
} from '../hooks';

export function TaskChecklistSection({
  workspaceId,
  taskId,
  boardId,
}: {
  workspaceId: string;
  taskId: string;
  boardId?: string | null;
}) {
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTaskChecklistQuery(workspaceId, taskId);
  const { data: templates = [] } = useDodTemplatesQuery(workspaceId);
  const createMutation = useCreateChecklistItemMutation(workspaceId, taskId, boardId);
  const updateMutation = useUpdateChecklistItemMutation(workspaceId, taskId, boardId);
  const deleteMutation = useDeleteChecklistItemMutation(workspaceId, taskId, boardId);
  const applyMutation = useApplyDodTemplateMutation(workspaceId, taskId, boardId);
  const [actionError, setActionError] = useState('');

  const onToggle = useCallback(
    async (itemId: string, completed: boolean) => {
      setActionError('');
      try {
        await updateMutation.mutateAsync({ itemId, data: { completed } });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось обновить пункт');
      }
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    async (itemId: string) => {
      setActionError('');
      try {
        await deleteMutation.mutateAsync(itemId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось удалить пункт');
      }
    },
    [deleteMutation],
  );

  const onCreate = useCallback(
    async (text: string) => {
      setActionError('');
      try {
        await createMutation.mutateAsync({ text });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось добавить пункт');
        throw err;
      }
    },
    [createMutation],
  );

  const onApplyTemplate = useCallback(
    async (templateId: string) => {
      setActionError('');
      try {
        await applyMutation.mutateAsync(templateId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось применить шаблон');
        throw err;
      }
    },
    [applyMutation],
  );

  const viewProps = useMemo(
    () => ({
      items,
      templates,
      isLoading,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить чеклист'
        : '',
      actionError,
      createPending: createMutation.isPending,
      updatePending: updateMutation.isPending,
      deletePending: deleteMutation.isPending,
      applyPending: applyMutation.isPending,
      onRetryLoad: () => {
        void refetch();
      },
      onToggle,
      onDelete,
      onCreate,
      onApplyTemplate,
    }),
    [
      items,
      templates,
      isLoading,
      isError,
      error,
      actionError,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      applyMutation.isPending,
      refetch,
      onToggle,
      onDelete,
      onCreate,
      onApplyTemplate,
    ],
  );

  return <VueIsland component={TaskChecklistSectionView} componentProps={viewProps} />;
}
