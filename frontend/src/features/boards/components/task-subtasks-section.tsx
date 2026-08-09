'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import {
  useCreateSubtaskMutation,
  useDeleteSubtaskMutation,
  useSubtasksQuery,
  useUpdateSubtaskMutation,
} from '@/features/subtasks/hooks';
import TaskSubtasksSectionView from '@/vue/boards/TaskSubtasksSection.vue';

export function TaskSubtasksSection({
  workspaceId,
  taskId,
  boardId,
}: {
  workspaceId: string;
  taskId: string;
  boardId?: string | null;
}) {
  const {
    data: subtasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSubtasksQuery(workspaceId, taskId);
  const createMutation = useCreateSubtaskMutation(workspaceId, taskId, boardId);
  const updateMutation = useUpdateSubtaskMutation(workspaceId, taskId, boardId);
  const deleteMutation = useDeleteSubtaskMutation(workspaceId, taskId, boardId);
  const [actionError, setActionError] = useState('');

  const onToggle = useCallback(
    async (subtaskId: string, completed: boolean) => {
      setActionError('');
      try {
        await updateMutation.mutateAsync({ subtaskId, data: { completed } });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось обновить подзадачу');
      }
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    async (subtaskId: string) => {
      setActionError('');
      try {
        await deleteMutation.mutateAsync(subtaskId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось удалить подзадачу');
      }
    },
    [deleteMutation],
  );

  const onCreate = useCallback(
    async (title: string) => {
      setActionError('');
      try {
        await createMutation.mutateAsync(title);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось добавить подзадачу');
        throw err;
      }
    },
    [createMutation],
  );

  const viewProps = useMemo(
    () => ({
      subtasks,
      isLoading,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить подзадачи'
        : '',
      actionError,
      createPending: createMutation.isPending,
      updatePending: updateMutation.isPending,
      deletePending: deleteMutation.isPending,
      onRetryLoad: () => {
        void refetch();
      },
      onToggle,
      onDelete,
      onCreate,
    }),
    [
      subtasks,
      isLoading,
      isError,
      error,
      actionError,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      refetch,
      onToggle,
      onDelete,
      onCreate,
    ],
  );

  return <VueIsland component={TaskSubtasksSectionView} componentProps={viewProps} />;
}
