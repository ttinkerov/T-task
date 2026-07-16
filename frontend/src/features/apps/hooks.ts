import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createExternalApp, deleteExternalApp, fetchExternalApps } from './api';
import type { CreateExternalAppPayload } from './types';

export const externalAppKeys = {
  all: ['external-apps'] as const,
  list: (workspaceId: string) => [...externalAppKeys.all, workspaceId] as const,
};

export function useExternalAppsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: externalAppKeys.list(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchExternalApps(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateExternalAppMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExternalAppPayload) => {
      const response = await createExternalApp(workspaceId, data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: externalAppKeys.list(workspaceId) });
    },
  });
}

export function useDeleteExternalAppMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      await deleteExternalApp(workspaceId, appId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: externalAppKeys.list(workspaceId) });
    },
  });
}
