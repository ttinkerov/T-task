'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
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
  const [fieldType, setFieldType] = useState<FormFieldType>('SHORT_TEXT');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined' || !form) return '';
    return `${window.location.origin}/f/${form.publicToken}`;
  }, [form]);

  if (isLoading || !form) {
    return <p className="text-sm text-muted-foreground">Загрузка формы...</p>;
  }

  const handleAddField = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fieldLabel.trim()) return;

    const options =
      fieldType === 'SINGLE_CHOICE' || fieldType === 'MULTIPLE_CHOICE'
        ? fieldOptions
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;

    await addFieldMutation.mutateAsync({
      type: fieldType,
      label: fieldLabel.trim(),
      options,
      required: fieldRequired,
    });

    setFieldLabel('');
    setFieldOptions('');
    setFieldRequired(false);
  };

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

      <div className="forms-editor__settings">
        <label className="forms-editor__checkbox">
          <input
            type="checkbox"
            checked={form.createTaskOnSubmit}
            onChange={(event) =>
              updateFormMutation.mutate({ createTaskOnSubmit: event.target.checked })
            }
          />
          Создавать задачу на доске при отправке ответа
        </label>
        <label className="forms-editor__checkbox">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(event) => updateFormMutation.mutate({ isPublic: event.target.checked })}
          />
          Форма доступна по публичной ссылке
        </label>
      </div>

      {tab === 'builder' ? (
        <div className="forms-editor__grid">
          <section className="forms-panel">
            <h2 className="forms-panel__title">Поля формы</h2>
            {form.fields.length === 0 ? (
              <p className="forms-panel__empty">Добавьте первое поле справа.</p>
            ) : (
              <ul className="forms-fields">
                {form.fields.map((field, index) => (
                  <li key={field.id} className="forms-fields__item">
                    <div>
                      <p className="forms-fields__label">
                        {index + 1}. {field.label}
                        {field.required ? ' *' : ''}
                      </p>
                      <p className="forms-fields__type">{FORM_FIELD_TYPE_LABELS[field.type]}</p>
                      {field.options.length > 0 ? (
                        <p className="forms-fields__options">{field.options.join(' · ')}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="btn-ghost forms-list__danger"
                      onClick={() => deleteFieldMutation.mutate(field.id)}
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="forms-panel">
            <h2 className="forms-panel__title">Добавить поле</h2>
            <form onSubmit={handleAddField} className="forms-add-field">
              <label className="task-drawer__field">
                <span>Тип поля</span>
                <select
                  value={fieldType}
                  onChange={(event) => setFieldType(event.target.value as FormFieldType)}
                  className="glass-input"
                >
                  {FORM_FIELD_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="task-drawer__field">
                <span>Вопрос</span>
                <input
                  value={fieldLabel}
                  onChange={(event) => setFieldLabel(event.target.value)}
                  className="glass-input"
                  maxLength={200}
                  required
                />
              </label>

              {fieldType === 'SINGLE_CHOICE' || fieldType === 'MULTIPLE_CHOICE' ? (
                <label className="task-drawer__field">
                  <span>Варианты (по одному на строку)</span>
                  <textarea
                    value={fieldOptions}
                    onChange={(event) => setFieldOptions(event.target.value)}
                    className="glass-input task-drawer__textarea"
                    rows={4}
                    placeholder={'Да\nНет\nНе знаю'}
                  />
                </label>
              ) : null}

              <label className="forms-editor__checkbox">
                <input
                  type="checkbox"
                  checked={fieldRequired}
                  onChange={(event) => setFieldRequired(event.target.checked)}
                />
                Обязательное поле
              </label>

              <button
                type="submit"
                disabled={!fieldLabel.trim() || addFieldMutation.isPending}
                className="btn-primary"
              >
                Добавить поле
              </button>
            </form>
          </section>
        </div>
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
