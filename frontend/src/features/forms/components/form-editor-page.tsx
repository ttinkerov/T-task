'use client';

import { useCallback, useMemo, useState } from 'react';
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
  const {
    data: responsesData,
    isError: responsesIsError,
    error: responsesError,
    refetch: refetchResponses,
  } = useFormResponsesQuery(workspaceId, formId);
  const updateFormMutation = useUpdateFormMutation(workspaceId, formId);
  const addFieldMutation = useAddFormFieldMutation(workspaceId, formId);
  const deleteFieldMutation = useDeleteFormFieldMutation(workspaceId, formId);
  const [actionError, setActionError] = useState('');

  const onUpdateMeta = useCallback(
    async (payload: { createTaskOnSubmit?: boolean; isPublic?: boolean }) => {
      setActionError('');
      try {
        await updateFormMutation.mutateAsync(payload);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось сохранить настройки формы');
      }
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
      setActionError('');
      try {
        await addFieldMutation.mutateAsync(payload);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось добавить поле');
        throw err;
      }
    },
    [addFieldMutation],
  );

  const onDeleteField = useCallback(
    async (fieldId: string) => {
      setActionError('');
      try {
        await deleteFieldMutation.mutateAsync(fieldId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось удалить поле');
      }
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
      actionError,
      responsesData: responsesData ?? null,
      responsesError: responsesIsError
        ? responsesError instanceof Error
          ? responsesError.message
          : 'Не удалось загрузить ответы'
        : '',
      onRetryResponses: () => {
        void refetchResponses();
      },
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
      actionError,
      responsesData,
      responsesIsError,
      responsesError,
      refetchResponses,
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
