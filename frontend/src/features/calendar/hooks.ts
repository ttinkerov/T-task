import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrRotateCalendarFeed, fetchCalendarFeedStatus, revokeCalendarFeed } from './api';
import type { CalendarFeedStatus } from './types';

export const calendarFeedKeys = {
  all: ['calendar-feed'] as const,
  status: (workspaceId: string) => [...calendarFeedKeys.all, workspaceId] as const,
};

export function useCalendarFeedStatusQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: calendarFeedKeys.status(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchCalendarFeedStatus(workspaceId!);
      return response.data;
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateOrRotateCalendarFeedMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await createOrRotateCalendarFeed(workspaceId);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calendarFeedKeys.status(workspaceId) });
    },
  });
}

export function useRevokeCalendarFeedMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await revokeCalendarFeed(workspaceId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.setQueryData<CalendarFeedStatus | null>(
        calendarFeedKeys.status(workspaceId),
        (current) =>
          current
            ? {
                enabled: false,
                tokenPrefix: null,
                createdAt: null,
                updatedAt: null,
              }
            : current,
      );
      void queryClient.invalidateQueries({ queryKey: calendarFeedKeys.status(workspaceId) });
    },
  });
}
