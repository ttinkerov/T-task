import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchStuckTasks, fetchStuckTasksInsight } from './api';
import type { StuckTasksParams } from './types';

export const analyticsKeys = {
  all: ['analytics'] as const,
  stuck: (workspaceId: string, params: StuckTasksParams) =>
    [...analyticsKeys.all, 'stuck', workspaceId, params] as const,
};

export function useStuckTasksQuery(workspaceId: string | null, params: StuckTasksParams = {}) {
  return useQuery({
    queryKey: analyticsKeys.stuck(workspaceId ?? '', params),
    queryFn: async () => {
      const response = await fetchStuckTasks(workspaceId!, params);
      return response.data!;
    },
    enabled: Boolean(workspaceId),
  });
}

export function useStuckTasksInsightMutation(workspaceId: string) {
  return useMutation({
    mutationFn: async (params: StuckTasksParams = {}) => {
      const response = await fetchStuckTasksInsight(workspaceId, params);
      return response.data!;
    },
  });
}
