'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import FormEditorPageView from '@/vue/forms/FormEditorPageView.vue';
import {
  useAddFormFieldMutation,
  useDeleteFormFieldMutation,
  useFormQuery,
  useFormResponsesQuery,
  useUpdateFormMutation,
} from '../hooks';
import { FORM_FIELD_TYPE_LABELS, FORM_FIELD_TYPE_OPTIONS, type FormFieldType } from '../types';

export function FormEditorPage({ workspaceId, formId }: { workspaceId: string; formId: string }) {
  const { data: form, isLoading, isError, error, refetch } = useFormQuery(workspaceId, formId);
  const { data: responsesData } = useFormResponsesQuery(workspaceId, formId);
  const updateFormMutation = useUpdateFormMutation(workspaceId, formId);
  const addFieldMutation = useAddFormFieldMutation(workspaceId, formId);
  const deleteFieldMutation = useDeleteFormFieldMutation(workspaceId, formId);

  const onUpdateMeta = useCallback(
    (payload: { createTaskOnSubmit?: boolean; isPublic?: boolean }) => {
      updateFormMutation.mutate(payload);
    },
    [updateFormMutation],
  );

  const onAddField = useCallback(
    async (payload: {
      type: FormFieldType;
      label: string;
      options?: string[];
      required?: boolean;
    }) => {
      await addFieldMutation.mutateAsync(payload);
    },
    [addFieldMutation],
  );

  const onDeleteField = useCallback(
    (fieldId: string) => {
      deleteFieldMutation.mutate(fieldId);
    },
    [deleteFieldMutation],
  );

  const pageProps = useMemo(
    () => ({
      title: form?.title ?? '',
      publicToken: form?.publicToken ?? '',
      fields: form?.fields ?? [],
      responseCount: form?.responseCount ?? 0,
      createTaskOnSubmit: Boolean(form?.createTaskOnSubmit),
      isPublic: Boolean(form?.isPublic),
      typeOptions: FORM_FIELD_TYPE_OPTIONS,
      typeLabels: FORM_FIELD_TYPE_LABELS,
      isAddingField: addFieldMutation.isPending,
      isDeletingField: deleteFieldMutation.isPending,
      responsesData: responsesData ?? null,
      onUpdateMeta,
      onAddField,
      onDeleteField,
    }),
    [
      form?.title,
      form?.publicToken,
      form?.fields,
      form?.responseCount,
      form?.createTaskOnSubmit,
      form?.isPublic,
      addFieldMutation.isPending,
      deleteFieldMutation.isPending,
      responsesData,
      onUpdateMeta,
      onAddField,
      onDeleteField,
    ],
  );

  if (isError) {
    return (
      <div role="alert">
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Не удалось загрузить форму'}
        </p>
        <button type="button" className="btn-ghost" onClick={() => void refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  if (isLoading || !form) {
    return <p className="text-sm text-muted-foreground">Загрузка формы...</p>;
  }

  return <VueIsland component={FormEditorPageView} componentProps={pageProps} />;
}
