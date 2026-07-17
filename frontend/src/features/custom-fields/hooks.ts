import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardKeys } from '@/features/boards/hooks';
import {
  createCustomField,
  deleteCustomField,
  fetchCustomFields,
  setTaskCustomField,
  updateCustomField,
} from './api';
import type { CreateCustomFieldPayload, CustomFieldValue, UpdateCustomFieldPayload } from './types';

export const customFieldKeys = {
  all: ['custom-fields'] as const,
  list: (workspaceId: string) => [...customFieldKeys.all, workspaceId] as const,
};

export function useCustomFieldsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: customFieldKeys.list(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchCustomFields(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateCustomFieldMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomFieldPayload) => {
      const response = await createCustomField(workspaceId, data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customFieldKeys.list(workspaceId) });
    },
  });
}

export function useUpdateCustomFieldMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fieldId, data }: { fieldId: string; data: UpdateCustomFieldPayload }) => {
      const response = await updateCustomField(workspaceId, fieldId, data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customFieldKeys.list(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

export function useDeleteCustomFieldMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldId: string) => {
      await deleteCustomField(workspaceId, fieldId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customFieldKeys.list(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

export function useSetTaskCustomFieldMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fieldId, value }: { fieldId: string; value: CustomFieldValue }) => {
      const response = await setTaskCustomField(workspaceId, taskId, fieldId, value);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}
