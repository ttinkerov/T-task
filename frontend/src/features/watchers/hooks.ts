import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTaskWatchers, unwatchTask, watchTask } from './api';

export const watcherKeys = {
  task: (workspaceId: string, taskId: string) => ['watchers', workspaceId, taskId] as const,
};

export function useTaskWatchersQuery(workspaceId: string, taskId: string) {
  return useQuery({
    queryKey: watcherKeys.task(workspaceId, taskId),
    queryFn: async () => {
      const response = await fetchTaskWatchers(workspaceId, taskId);
      return response.data!;
    },
    enabled: Boolean(workspaceId && taskId),
  });
}

export function useToggleWatchMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (watching: boolean) => {
      const response = watching
        ? await unwatchTask(workspaceId, taskId)
        : await watchTask(workspaceId, taskId);
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(watcherKeys.task(workspaceId, taskId), data);
    },
  });
}
