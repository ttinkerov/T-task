'use client';

import { useEffect, useState } from 'react';
import { useMembersQuery } from '@/features/workspaces/hooks';
import {
  useCustomFieldsQuery,
  useSetTaskCustomFieldMutation,
} from '@/features/custom-fields/hooks';
import type { CustomFieldDefinition, CustomFieldValue } from '@/features/custom-fields/types';
import type { TaskCustomFieldValue } from '../types';
import { FieldHint } from './field-hint';

interface TaskCustomFieldsSectionProps {
  workspaceId: string;
  taskId: string;
  values: TaskCustomFieldValue[];
}

export function TaskCustomFieldsSection({
  workspaceId,
  taskId,
  values,
}: TaskCustomFieldsSectionProps) {
  const fieldsQuery = useCustomFieldsQuery(workspaceId);
  const { data: members = [] } = useMembersQuery(workspaceId);
  const setValueMutation = useSetTaskCustomFieldMutation(workspaceId, taskId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const definitions = fieldsQuery.data ?? [];
  const valueMap = new Map(values.map((entry) => [entry.fieldId, entry.value]));

  const save = async (fieldId: string, value: CustomFieldValue) => {
    setPendingId(fieldId);
    try {
      await setValueMutation.mutateAsync({ fieldId, value });
    } catch {
      // error surfaced below
    } finally {
      setPendingId(null);
    }
  };

  if (fieldsQuery.isLoading) {
    return (
      <section className="task-custom-fields" aria-labelledby="task-custom-fields-title">
        <h3 id="task-custom-fields-title" className="task-drawer__section-title">
          Кастомные поля
          <FieldHint text="Дополнительные поля команды: текст, число, дата, список и т.д." />
        </h3>
        <p className="text-sm text-muted-foreground" role="status">
          Загрузка полей…
        </p>
      </section>
    );
  }

  if (definitions.length === 0) {
    return null;
  }

  return (
    <section className="task-custom-fields" aria-labelledby="task-custom-fields-title">
      <h3 id="task-custom-fields-title" className="task-drawer__section-title">
        Кастомные поля
        <FieldHint text="Дополнительные поля команды: текст, число, дата, список и т.д." />
      </h3>
      <div className="task-custom-fields__list">
        {definitions.map((definition) => (
          <CustomFieldEditor
            key={definition.id}
            definition={definition}
            value={valueMap.get(definition.id) ?? null}
            members={members}
            disabled={pendingId === definition.id}
            onSave={(value) => void save(definition.id, value)}
          />
        ))}
      </div>
      {setValueMutation.error ? (
        <p className="task-custom-fields__error" role="alert">
          {setValueMutation.error.message}
        </p>
      ) : null}
    </section>
  );
}

interface CustomFieldEditorProps {
  definition: CustomFieldDefinition;
  value: TaskCustomFieldValue['value'];
  members: { userId: string; user: { name: string } }[];
  disabled: boolean;
  onSave: (value: CustomFieldValue) => void;
}

function CustomFieldEditor({
  definition,
  value,
  members,
  disabled,
  onSave,
}: CustomFieldEditorProps) {
  const [draft, setDraft] = useState<string>(toInputString(value));

  useEffect(() => {
    setDraft(toInputString(value));
  }, [value]);

  const fieldId = `custom-field-${definition.id}`;

  switch (definition.type) {
    case 'CHECKBOX':
      return (
        <label className="task-custom-fields__checkbox">
          <input
            id={fieldId}
            type="checkbox"
            checked={value === true}
            disabled={disabled}
            onChange={(event) => onSave(event.target.checked)}
          />
          <span>{definition.name}</span>
        </label>
      );
    case 'SELECT':
      return (
        <label className="task-custom-fields__field">
          <span>{definition.name}</span>
          <select
            id={fieldId}
            className="glass-input"
            value={typeof value === 'string' ? value : ''}
            disabled={disabled}
            onChange={(event) => onSave(event.target.value || null)}
          >
            <option value="">Не выбрано</option>
            {definition.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    case 'MULTI_SELECT': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <fieldset className="task-custom-fields__field task-custom-fields__multiselect">
          <legend>{definition.name}</legend>
          {definition.options.map((option) => (
            <label key={option} className="task-custom-fields__multiselect-option">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                disabled={disabled}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option);
                  onSave(next.length > 0 ? next : null);
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      );
    }
    case 'USER':
      return (
        <label className="task-custom-fields__field">
          <span>{definition.name}</span>
          <select
            id={fieldId}
            className="glass-input"
            value={typeof value === 'string' ? value : ''}
            disabled={disabled}
            onChange={(event) => onSave(event.target.value || null)}
          >
            <option value="">Не выбрано</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user.name}
              </option>
            ))}
          </select>
        </label>
      );
    case 'DATE':
      return (
        <label className="task-custom-fields__field">
          <span>{definition.name}</span>
          <input
            id={fieldId}
            type="date"
            className="glass-input"
            value={draft}
            disabled={disabled}
            onChange={(event) => {
              setDraft(event.target.value);
              onSave(
                event.target.value
                  ? new Date(`${event.target.value}T12:00:00`).toISOString()
                  : null,
              );
            }}
          />
        </label>
      );
    case 'NUMBER':
      return (
        <label className="task-custom-fields__field">
          <span>{definition.name}</span>
          <input
            id={fieldId}
            type="number"
            className="glass-input"
            value={draft}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => onSave(draft.trim() === '' ? null : Number(draft))}
          />
        </label>
      );
    default:
      return (
        <label className="task-custom-fields__field">
          <span>{definition.name}</span>
          <input
            id={fieldId}
            type={definition.type === 'URL' ? 'url' : 'text'}
            className="glass-input"
            value={draft}
            disabled={disabled}
            maxLength={definition.type === 'URL' ? 2048 : 2000}
            placeholder={definition.type === 'URL' ? 'https://…' : ''}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => onSave(draft.trim() === '' ? null : draft.trim())}
          />
        </label>
      );
  }
}

function toInputString(value: TaskCustomFieldValue['value']): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return '';
  if (typeof value === 'boolean') return '';
  if (typeof value === 'string' && isIsoDate(value)) return value.slice(0, 10);
  return String(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}
