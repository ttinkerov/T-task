import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchAllTasks } from './api';
import type { AllTasksQuery } from './types';

export const allTasksKeys = {
  all: ['all-tasks'] as const,
  list: (workspaceId: string, query: AllTasksQuery) =>
    [...allTasksKeys.all, workspaceId, query] as const,
};

export function useAllTasksQuery(workspaceId: string | null, query: AllTasksQuery) {
  return useQuery({
    queryKey: allTasksKeys.list(workspaceId ?? '', query),
    queryFn: async () => {
      const response = await fetchAllTasks(workspaceId!, query);
      return response.data;
    },
    enabled: Boolean(workspaceId),
    placeholderData: keepPreviousData,
  });
}
