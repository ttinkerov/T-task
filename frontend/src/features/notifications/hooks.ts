import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './api';

export const notificationKeys = {
  all: ['notifications'] as const,
  inbox: (workspaceId: string) => [...notificationKeys.all, workspaceId] as const,
};

export function useNotificationsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: notificationKeys.inbox(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchNotifications(workspaceId!);
      return response.data;
    },
    enabled: Boolean(workspaceId),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationReadMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(workspaceId, notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.inbox(workspaceId) });
    },
  });
}

export function useMarkAllNotificationsReadMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(workspaceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.inbox(workspaceId) });
    },
  });
}
