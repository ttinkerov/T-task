import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyEpicBreakdown,
  deleteAiSettings,
  fetchAiRagStatus,
  fetchAiSettings,
  fetchAiSummary,
  proposeEpicBreakdown,
  reindexAiRag,
  sendAiChat,
  testAiConnection,
  upsertAiSettings,
} from './api';
import type {
  AiChatPayload,
  AiSummaryPayload,
  ApplyEpicBreakdownPayload,
  ProposeEpicBreakdownPayload,
  UpsertAiSettingsPayload,
} from './types';

export const aiKeys = {
  all: ['ai'] as const,
  settings: (workspaceId: string) => [...aiKeys.all, 'settings', workspaceId] as const,
  ragStatus: (workspaceId: string) => [...aiKeys.all, 'rag', workspaceId] as const,
};

export function useAiSettingsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: aiKeys.settings(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchAiSettings(workspaceId!);
      return response.data!;
    },
    enabled: Boolean(workspaceId),
  });
}

export function useAiRagStatusQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: aiKeys.ragStatus(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchAiRagStatus(workspaceId!);
      return response.data!;
    },
    enabled: Boolean(workspaceId),
  });
}

export function useUpsertAiSettingsMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpsertAiSettingsPayload) => {
      const response = await upsertAiSettings(workspaceId, data);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiKeys.settings(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: aiKeys.ragStatus(workspaceId) });
    },
  });
}

export function useDeleteAiSettingsMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await deleteAiSettings(workspaceId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiKeys.settings(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: aiKeys.ragStatus(workspaceId) });
    },
  });
}

export function useTestAiConnectionMutation(workspaceId: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await testAiConnection(workspaceId);
      return response.data!;
    },
  });
}

export function useReindexAiRagMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await reindexAiRag(workspaceId);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiKeys.ragStatus(workspaceId) });
    },
  });
}

export function useAiChatMutation(workspaceId: string) {
  return useMutation({
    mutationFn: async (data: AiChatPayload) => {
      const response = await sendAiChat(workspaceId, data);
      return response.data!;
    },
  });
}

export function useAiSummaryMutation(workspaceId: string) {
  return useMutation({
    mutationFn: async (data: AiSummaryPayload) => {
      const response = await fetchAiSummary(workspaceId, data);
      return response.data!;
    },
  });
}

export function useProposeEpicBreakdownMutation(workspaceId: string, epicId: string) {
  return useMutation({
    mutationFn: async (data: ProposeEpicBreakdownPayload = {}) => {
      const response = await proposeEpicBreakdown(workspaceId, epicId, data);
      return response.data!;
    },
  });
}

export function useApplyEpicBreakdownMutation(workspaceId: string, epicId: string) {
  return useMutation({
    mutationFn: async (data: ApplyEpicBreakdownPayload) => {
      const response = await applyEpicBreakdown(workspaceId, epicId, data);
      return response.data!;
    },
  });
}
