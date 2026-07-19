import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardKeys } from '@/features/boards/hooks';
import { createSubtask, deleteSubtask, fetchSubtasks, updateSubtask } from './api';

export const subtaskKeys = {
  all: ['subtasks'] as const,
  list: (workspaceId: string, taskId: string) => [...subtaskKeys.all, workspaceId, taskId] as const,
};

export function useSubtasksQuery(workspaceId: string, taskId: string) {
  return useQuery({
    queryKey: subtaskKeys.list(workspaceId, taskId),
    queryFn: async () => {
      const response = await fetchSubtasks(workspaceId, taskId);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId && taskId),
  });
}

function invalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  taskId: string,
) {
  void queryClient.invalidateQueries({ queryKey: subtaskKeys.list(workspaceId, taskId) });
  void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
  void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
}

export function useCreateSubtaskMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const response = await createSubtask(workspaceId, taskId, title);
      return response.data;
    },
    onSuccess: () => invalidate(queryClient, workspaceId, taskId),
  });
}

export function useUpdateSubtaskMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subtaskId,
      data,
    }: {
      subtaskId: string;
      data: { title?: string; completed?: boolean };
    }) => {
      const response = await updateSubtask(workspaceId, taskId, subtaskId, data);
      return response.data;
    },
    onSuccess: () => invalidate(queryClient, workspaceId, taskId),
  });
}

export function useDeleteSubtaskMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subtaskId: string) => {
      await deleteSubtask(workspaceId, taskId, subtaskId);
    },
    onSuccess: () => invalidate(queryClient, workspaceId, taskId),
  });
}
