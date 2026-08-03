'use client';

import { FormEvent, useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import CustomFieldList from '@/vue/custom-fields/CustomFieldList.vue';
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

  const onToggleCard = useCallback(
    async (payload: { fieldId: string; showOnCard: boolean }) => {
      setPendingId(payload.fieldId);
      try {
        await updateMutation.mutateAsync({
          fieldId: payload.fieldId,
          data: { showOnCard: payload.showOnCard },
        });
      } catch {
        /* ignore */
      } finally {
        setPendingId(null);
      }
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    async (fieldId: string) => {
      setPendingId(fieldId);
      try {
        await deleteMutation.mutateAsync(fieldId);
      } catch {
        /* ignore */
      } finally {
        setPendingId(null);
      }
    },
    [deleteMutation],
  );

  const listProps = useMemo(
    () => ({
      fields,
      isLoading: fieldsQuery.isLoading,
      isError: Boolean(fieldsQuery.error),
      canManage,
      pendingId,
      typeLabels: CUSTOM_FIELD_TYPE_LABELS,
      onToggleCard,
      onDelete,
    }),
    [
      fields,
      fieldsQuery.isLoading,
      fieldsQuery.error,
      canManage,
      pendingId,
      onToggleCard,
      onDelete,
    ],
  );

  return (
    <div className="custom-fields-page">
      <header className="custom-fields-page__header">
        <h1>Кастомные поля</h1>
        <p>
          Создавай собственные поля в задачах под процессы команды: бюджеты, ссылки, статусы,
          ответственных или метки. Значения полей можно вынести на карточки задач.
        </p>
      </header>

      <VueIsland component={CustomFieldList} componentProps={listProps} />

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
