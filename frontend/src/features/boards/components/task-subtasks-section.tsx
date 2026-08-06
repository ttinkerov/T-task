'use client';

import { useCallback, useMemo } from 'react';
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
  const { data: subtasks = [], isLoading } = useSubtasksQuery(workspaceId, taskId);
  const createMutation = useCreateSubtaskMutation(workspaceId, taskId, boardId);
  const updateMutation = useUpdateSubtaskMutation(workspaceId, taskId, boardId);
  const deleteMutation = useDeleteSubtaskMutation(workspaceId, taskId, boardId);

  const onToggle = useCallback(
    (subtaskId: string, completed: boolean) => {
      updateMutation.mutate({ subtaskId, data: { completed } });
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    (subtaskId: string) => {
      deleteMutation.mutate(subtaskId);
    },
    [deleteMutation],
  );

  const onCreate = useCallback(
    (title: string) =>
      new Promise<void>((resolve, reject) => {
        createMutation.mutate(title, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
    [createMutation],
  );

  const viewProps = useMemo(
    () => ({
      subtasks,
      isLoading,
      createPending: createMutation.isPending,
      updatePending: updateMutation.isPending,
      deletePending: deleteMutation.isPending,
      onToggle,
      onDelete,
      onCreate,
    }),
    [
      subtasks,
      isLoading,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      onToggle,
      onDelete,
      onCreate,
    ],
  );

  return <VueIsland component={TaskSubtasksSectionView} componentProps={viewProps} />;
}
