'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import FormEditorBuilder from '@/vue/forms/FormEditorBuilder.vue';
import {
  useAddFormFieldMutation,
  useDeleteFormFieldMutation,
  useFormQuery,
  useFormResponsesQuery,
  useUpdateFormMutation,
} from '../hooks';
import { FORM_FIELD_TYPE_LABELS, FORM_FIELD_TYPE_OPTIONS, type FormFieldType } from '../types';

export function FormEditorPage({ workspaceId, formId }: { workspaceId: string; formId: string }) {
  const { data: form, isLoading } = useFormQuery(workspaceId, formId);
  const { data: responsesData } = useFormResponsesQuery(workspaceId, formId);
  const updateFormMutation = useUpdateFormMutation(workspaceId, formId);
  const addFieldMutation = useAddFormFieldMutation(workspaceId, formId);
  const deleteFieldMutation = useDeleteFormFieldMutation(workspaceId, formId);

  const [tab, setTab] = useState<'builder' | 'responses'>('builder');

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined' || !form) return '';
    return `${window.location.origin}/f/${form.publicToken}`;
  }, [form]);

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

  const builderProps = useMemo(
    () => ({
      fields: form?.fields ?? [],
      createTaskOnSubmit: Boolean(form?.createTaskOnSubmit),
      isPublic: Boolean(form?.isPublic),
      typeOptions: FORM_FIELD_TYPE_OPTIONS,
      typeLabels: FORM_FIELD_TYPE_LABELS,
      isAddingField: addFieldMutation.isPending,
      isDeletingField: deleteFieldMutation.isPending,
      onUpdateMeta,
      onAddField,
      onDeleteField,
    }),
    [
      form?.fields,
      form?.createTaskOnSubmit,
      form?.isPublic,
      addFieldMutation.isPending,
      deleteFieldMutation.isPending,
      onUpdateMeta,
      onAddField,
      onDeleteField,
    ],
  );

  if (isLoading || !form) {
    return <p className="text-sm text-muted-foreground">Загрузка формы...</p>;
  }

  return (
    <div className="forms-page">
      <header className="forms-page__header">
        <div>
          <Link href="/dashboard/forms" className="forms-page__back">
            ← Все формы
          </Link>
          <h1 className="forms-page__title">{form.title}</h1>
          <p className="forms-page__subtitle">
            {form.responseCount} ответов · {form.fields.length} полей
          </p>
        </div>
      </header>

      <div className="forms-editor__toolbar">
        <div className="forms-editor__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={
              tab === 'builder'
                ? 'forms-editor__tab forms-editor__tab--active'
                : 'forms-editor__tab'
            }
            onClick={() => setTab('builder')}
          >
            Конструктор
          </button>
          <button
            type="button"
            role="tab"
            className={
              tab === 'responses'
                ? 'forms-editor__tab forms-editor__tab--active'
                : 'forms-editor__tab'
            }
            onClick={() => setTab('responses')}
          >
            Ответы ({responsesData?.total ?? form.responseCount})
          </button>
        </div>

        <div className="forms-editor__share">
          <input readOnly value={publicUrl} className="glass-input forms-editor__link" />
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigator.clipboard.writeText(publicUrl)}
          >
            Копировать
          </button>
        </div>
      </div>

      {tab === 'builder' ? (
        <VueIsland component={FormEditorBuilder} componentProps={builderProps} />
      ) : (
        <FormResponsesPanel form={form} responsesData={responsesData} />
      )}
    </div>
  );
}

function FormResponsesPanel({
  form,
  responsesData,
}: {
  form: { fields: { id: string; label: string }[] };
  responsesData?: {
    total: number;
    stats: { fieldId: string; label: string; options: { option: string; count: number }[] }[];
    responses: { id: string; answers: Record<string, string | string[]>; createdAt: string }[];
  } | null;
}) {
  if (!responsesData || responsesData.total === 0) {
    return <p className="forms-page__empty">Пока нет ответов на эту форму.</p>;
  }

  return (
    <div className="forms-responses">
      {responsesData.stats.length > 0 ? (
        <section className="forms-panel">
          <h2 className="forms-panel__title">Статистика по вариантам</h2>
          <div className="forms-stats">
            {responsesData.stats.map((stat) => (
              <div key={stat.fieldId} className="forms-stats__block">
                <h3>{stat.label}</h3>
                <ul>
                  {stat.options.map((item) => (
                    <li key={item.option}>
                      <span>{item.option}</span>
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="forms-panel">
        <h2 className="forms-panel__title">Все ответы</h2>
        <div className="board-workload__table-wrap">
          <table className="board-workload__table">
            <thead>
              <tr>
                <th>Дата</th>
                {form.fields.map((field) => (
                  <th key={field.id}>{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responsesData.responses.map((response) => (
                <tr key={response.id}>
                  <td>
                    {new Date(response.createdAt).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  {form.fields.map((field) => {
                    const value = response.answers[field.id];
                    const rendered = Array.isArray(value)
                      ? value.join(', ')
                      : value
                        ? String(value)
                        : '—';
                    return <td key={field.id}>{rendered}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
