import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateWorkspaceBoards } from '@/features/boards/hooks';
import { importTasks } from './api';
import type { ImportTasksPayload } from './types';

export function useImportTasksMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ImportTasksPayload) => {
      const response = await importTasks(workspaceId, data);
      return response.data!;
    },
    onSuccess: () => {
      invalidateWorkspaceBoards(queryClient, workspaceId);
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ['tags', workspaceId] });
    },
  });
}
