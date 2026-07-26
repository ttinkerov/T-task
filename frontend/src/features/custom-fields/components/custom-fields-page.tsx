'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import {
  useCreateCustomFieldMutation,
  useCustomFieldsQuery,
  useDeleteCustomFieldMutation,
  useUpdateCustomFieldMutation,
} from '../hooks';
import {
  CHOICE_FIELD_TYPES,
  CUSTOM_FIELD_TYPE_LABELS,
  CUSTOM_FIELD_TYPE_OPTIONS,
  type CustomFieldType,
} from '../types';

interface CustomFieldsPageProps {
  workspaceId: string;
}

export function CustomFieldsPage({ workspaceId }: CustomFieldsPageProps) {
  const { data: session } = useMeQuery();
  const fieldsQuery = useCustomFieldsQuery(workspaceId);
  const createMutation = useCreateCustomFieldMutation(workspaceId);
  const updateMutation = useUpdateCustomFieldMutation(workspaceId);
  const deleteMutation = useDeleteCustomFieldMutation(workspaceId);

  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('TEXT');
  const [optionsText, setOptionsText] = useState('');
  const [showOnCard, setShowOnCard] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const role = session?.workspaces.find((workspace) => workspace.id === workspaceId)?.role;
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';

  const fields = fieldsQuery.data ?? [];
  const needsOptions = CHOICE_FIELD_TYPES.includes(type);

  const parsedOptions = useMemo(
    () =>
      optionsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [optionsText],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        type,
        options: needsOptions ? parsedOptions : undefined,
        showOnCard,
      });
      setName('');
      setOptionsText('');
      setShowOnCard(false);
      setType('TEXT');
    } catch {
      /* ignore */
    }
  };

  const handleToggleCard = async (fieldId: string, next: boolean) => {
    setPendingId(fieldId);
    try {
      await updateMutation.mutateAsync({ fieldId, data: { showOnCard: next } });
    } catch {
      /* ignore */
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (fieldId: string) => {
    setPendingId(fieldId);
    try {
      await deleteMutation.mutateAsync(fieldId);
    } catch {
      /* ignore */
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="custom-fields-page">
      <header className="custom-fields-page__header">
        <h1>Кастомные поля</h1>
        <p>
          Создавай собственные поля в задачах под процессы команды: бюджеты, ссылки, статусы,
          ответственных или метки. Значения полей можно вынести на карточки задач.
        </p>
      </header>

      <section
        className="custom-fields-page__list-block"
        aria-labelledby="custom-fields-list-title"
      >
        <h2 id="custom-fields-list-title">Поля команды</h2>

        {fieldsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground" role="status">
            Загрузка полей…
          </p>
        ) : fieldsQuery.error ? (
          <p className="custom-fields-page__error" role="alert">
            Не удалось загрузить поля.
          </p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет ни одного поля.</p>
        ) : (
          <ul className="custom-fields-page__list" role="list">
            {fields.map((field) => (
              <li key={field.id} className="custom-fields-page__item">
                <div className="custom-fields-page__item-main">
                  <span className="custom-fields-page__item-name">{field.name}</span>
                  <span className="custom-fields-page__badge">
                    {CUSTOM_FIELD_TYPE_LABELS[field.type]}
                  </span>
                  {field.options.length > 0 ? (
                    <span className="custom-fields-page__options">{field.options.join(', ')}</span>
                  ) : null}
                </div>
                {canManage ? (
                  <div className="custom-fields-page__item-actions">
                    <label className="custom-fields-page__toggle">
                      <input
                        type="checkbox"
                        checked={field.showOnCard}
                        disabled={pendingId === field.id}
                        onChange={(event) => void handleToggleCard(field.id, event.target.checked)}
                      />
                      <span>На карточке</span>
                    </label>
                    <button
                      type="button"
                      className="custom-fields-page__delete"
                      onClick={() => void handleDelete(field.id)}
                      disabled={pendingId === field.id}
                      aria-label={`Удалить поле «${field.name}»`}
                    >
                      {pendingId === field.id ? '…' : 'Удалить'}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage ? (
        <section
          className="custom-fields-page__form-block"
          aria-labelledby="custom-fields-form-title"
        >
          <h2 id="custom-fields-form-title">Новое поле</h2>
          <form className="custom-fields-page__form" onSubmit={handleSubmit}>
            <label className="custom-fields-page__field">
              <span>Название</span>
              <input
                className="glass-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                placeholder="Например, Бюджет"
                required
              />
            </label>

            <label className="custom-fields-page__field">
              <span>Тип</span>
              <select
                className="glass-input"
                value={type}
                onChange={(event) => setType(event.target.value as CustomFieldType)}
              >
                {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {needsOptions ? (
              <label className="custom-fields-page__field">
                <span>Варианты (по одному на строку)</span>
                <textarea
                  className="glass-input custom-fields-page__textarea"
                  value={optionsText}
                  onChange={(event) => setOptionsText(event.target.value)}
                  rows={4}
                  placeholder={'Низкий\nСредний\nВысокий'}
                />
              </label>
            ) : null}

            <label className="custom-fields-page__checkbox">
              <input
                type="checkbox"
                checked={showOnCard}
                onChange={(event) => setShowOnCard(event.target.checked)}
              />
              <span>Показывать значение на карточке задачи</span>
            </label>

            {createMutation.error ? (
              <p className="custom-fields-page__error" role="alert">
                {createMutation.error.message}
              </p>
            ) : null}

            <button
              type="submit"
              className="btn-primary"
              disabled={
                createMutation.isPending ||
                !name.trim() ||
                (needsOptions && parsedOptions.length < 2)
              }
            >
              {createMutation.isPending ? 'Создание…' : 'Создать поле'}
            </button>
            {needsOptions && parsedOptions.length < 2 ? (
              <p className="text-sm text-muted-foreground">
                Для поля выбора нужно минимум 2 варианта.
              </p>
            ) : null}
          </form>
        </section>
      ) : null}
    </div>
  );
}
