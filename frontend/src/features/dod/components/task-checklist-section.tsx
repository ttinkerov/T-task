'use client';

import { useCallback, useMemo } from 'react';
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
  const { data: items = [], isLoading } = useTaskChecklistQuery(workspaceId, taskId);
  const { data: templates = [] } = useDodTemplatesQuery(workspaceId);
  const createMutation = useCreateChecklistItemMutation(workspaceId, taskId, boardId);
  const updateMutation = useUpdateChecklistItemMutation(workspaceId, taskId, boardId);
  const deleteMutation = useDeleteChecklistItemMutation(workspaceId, taskId, boardId);
  const applyMutation = useApplyDodTemplateMutation(workspaceId, taskId, boardId);

  const onToggle = useCallback(
    (itemId: string, completed: boolean) => {
      updateMutation.mutate({ itemId, data: { completed } });
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    (itemId: string) => {
      deleteMutation.mutate(itemId);
    },
    [deleteMutation],
  );

  const onCreate = useCallback(
    (text: string) =>
      new Promise<void>((resolve, reject) => {
        createMutation.mutate(
          { text },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          },
        );
      }),
    [createMutation],
  );

  const onApplyTemplate = useCallback(
    (templateId: string) =>
      new Promise<void>((resolve, reject) => {
        applyMutation.mutate(templateId, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
    [applyMutation],
  );

  const viewProps = useMemo(
    () => ({
      items,
      templates,
      isLoading,
      createPending: createMutation.isPending,
      updatePending: updateMutation.isPending,
      deletePending: deleteMutation.isPending,
      applyPending: applyMutation.isPending,
      onToggle,
      onDelete,
      onCreate,
      onApplyTemplate,
    }),
    [
      items,
      templates,
      isLoading,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      applyMutation.isPending,
      onToggle,
      onDelete,
      onCreate,
      onApplyTemplate,
    ],
  );

  return <VueIsland component={TaskChecklistSectionView} componentProps={viewProps} />;
}
