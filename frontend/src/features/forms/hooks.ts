import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFormField,
  createForm,
  deleteForm,
  deleteFormField,
  fetchForm,
  fetchFormResponses,
  fetchForms,
  fetchPublicForm,
  submitPublicForm,
  updateForm,
  updateFormField,
} from './api';
import type { FormFieldType } from './types';

export const formKeys = {
  all: ['forms'] as const,
  list: (workspaceId: string) => [...formKeys.all, workspaceId, 'list'] as const,
  detail: (workspaceId: string, formId: string) =>
    [...formKeys.all, workspaceId, 'detail', formId] as const,
  responses: (workspaceId: string, formId: string) =>
    [...formKeys.all, workspaceId, 'responses', formId] as const,
  public: (token: string) => [...formKeys.all, 'public', token] as const,
};

export function useFormsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: formKeys.list(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchForms(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useFormQuery(workspaceId: string | null, formId: string | null) {
  return useQuery({
    queryKey: formKeys.detail(workspaceId ?? '', formId ?? ''),
    queryFn: async () => {
      const response = await fetchForm(workspaceId!, formId!);
      return response.data;
    },
    enabled: Boolean(workspaceId && formId),
  });
}

export function useFormResponsesQuery(workspaceId: string | null, formId: string | null) {
  return useQuery({
    queryKey: formKeys.responses(workspaceId ?? '', formId ?? ''),
    queryFn: async () => {
      const response = await fetchFormResponses(workspaceId!, formId!);
      return response.data;
    },
    enabled: Boolean(workspaceId && formId),
  });
}

export function usePublicFormQuery(token: string | null) {
  return useQuery({
    queryKey: formKeys.public(token ?? ''),
    queryFn: async () => {
      const response = await fetchPublicForm(token!);
      return response.data;
    },
    enabled: Boolean(token),
  });
}

export function useCreateFormMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const response = await createForm(workspaceId, { title });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formKeys.list(workspaceId) });
    },
  });
}

export function useUpdateFormMutation(workspaceId: string, formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof updateForm>[2]) => {
      await updateForm(workspaceId, formId, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formKeys.detail(workspaceId, formId) });
      void queryClient.invalidateQueries({ queryKey: formKeys.list(workspaceId) });
    },
  });
}

export function useDeleteFormMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId: string) => {
      await deleteForm(workspaceId, formId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formKeys.list(workspaceId) });
    },
  });
}

export function useAddFormFieldMutation(workspaceId: string, formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: FormFieldType;
      label: string;
      options?: string[];
      required?: boolean;
    }) => {
      await addFormField(workspaceId, formId, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formKeys.detail(workspaceId, formId) });
    },
  });
}

export function useUpdateFormFieldMutation(workspaceId: string, formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fieldId,
      data,
    }: {
      fieldId: string;
      data: Parameters<typeof updateFormField>[3];
    }) => {
      await updateFormField(workspaceId, formId, fieldId, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formKeys.detail(workspaceId, formId) });
    },
  });
}

export function useDeleteFormFieldMutation(workspaceId: string, formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldId: string) => {
      await deleteFormField(workspaceId, formId, fieldId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formKeys.detail(workspaceId, formId) });
    },
  });
}

export function useSubmitPublicFormMutation(token: string) {
  return useMutation({
    mutationFn: async (answers: Record<string, string | string[]>) => {
      await submitPublicForm(token, answers);
    },
  });
}
