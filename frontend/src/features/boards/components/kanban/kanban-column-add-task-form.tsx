'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useTaskTemplatesQuery } from '@/features/templates';
import KanbanColumnAddTaskFormView from '@/vue/boards/KanbanColumnAddTaskForm.vue';
import { useCreateTaskMutation } from '../../hooks';

export function KanbanColumnAddTaskForm({
  workspaceId,
  boardId,
  columnId,
}: {
  workspaceId: string;
  boardId: string;
  columnId: string;
}) {
  const createMutation = useCreateTaskMutation(workspaceId, boardId);
  const { data: taskTemplates = [] } = useTaskTemplatesQuery(workspaceId);

  const templates = useMemo(
    () =>
      taskTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        title: template.title,
      })),
    [taskTemplates],
  );

  const onCreate = useCallback(
    async (payload: { title: string; templateId?: string }) => {
      await createMutation.mutateAsync({
        title: payload.title,
        columnId,
        ...(payload.templateId ? { templateId: payload.templateId } : {}),
      });
    },
    [columnId, createMutation],
  );

  const viewProps = useMemo(
    () => ({
      templates,
      pending: createMutation.isPending,
      onCreate,
    }),
    [templates, createMutation.isPending, onCreate],
  );

  return <VueIsland component={KanbanColumnAddTaskFormView} componentProps={viewProps} />;
}
