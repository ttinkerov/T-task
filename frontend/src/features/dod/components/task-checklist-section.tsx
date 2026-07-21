'use client';

import { useState } from 'react';
import {
  useApplyDodTemplateMutation,
  useCreateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useDodTemplatesQuery,
  useTaskChecklistQuery,
  useUpdateChecklistItemMutation,
} from '../hooks';

export function TaskChecklistSection({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const { data: items = [], isLoading } = useTaskChecklistQuery(workspaceId, taskId);
  const { data: templates = [] } = useDodTemplatesQuery(workspaceId);
  const createMutation = useCreateChecklistItemMutation(workspaceId, taskId);
  const updateMutation = useUpdateChecklistItemMutation(workspaceId, taskId);
  const deleteMutation = useDeleteChecklistItemMutation(workspaceId, taskId);
  const applyMutation = useApplyDodTemplateMutation(workspaceId, taskId);
  const [text, setText] = useState('');
  const [templateId, setTemplateId] = useState('');

  const completed = items.filter((item) => item.completed).length;
  const requiredOpen = items.filter((item) => item.required && !item.completed).length;

  return (
    <section
      className={`task-checklist${requiredOpen > 0 ? ' task-checklist--blocking' : ''}`}
      aria-labelledby="task-checklist-title"
    >
      <div className="task-checklist__header">
        <h3 id="task-checklist-title">Definition of Done</h3>
        <span>
          {completed}/{items.length}
          {requiredOpen > 0 ? ` · ${requiredOpen} обяз.` : ''}
        </span>
      </div>

      {isLoading ? <p role="status">Загрузка DoD...</p> : null}

      {templates.length > 0 ? (
        <div className="task-checklist__apply">
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            aria-label="Шаблон DoD"
          >
            <option value="">Применить шаблон…</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!templateId || applyMutation.isPending}
            onClick={() => {
              if (!templateId) return;
              applyMutation.mutate(templateId, { onSuccess: () => setTemplateId('') });
            }}
          >
            Применить
          </button>
        </div>
      ) : null}

      <ul className="task-checklist__list" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={item.completed}
                disabled={updateMutation.isPending}
                onChange={(event) =>
                  updateMutation.mutate({
                    itemId: item.id,
                    data: { completed: event.target.checked },
                  })
                }
              />
              <span className={item.completed ? 'is-done' : undefined}>
                {item.text}
                {item.required ? <em title="Обязательный">*</em> : null}
              </span>
            </label>
            <button
              type="button"
              aria-label={`Удалить пункт ${item.text}`}
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(item.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form
        className="task-checklist__create"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) return;
          createMutation.mutate({ text: text.trim() }, { onSuccess: () => setText('') });
        }}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Новый пункт DoD"
          maxLength={200}
          aria-label="Текст пункта DoD"
        />
        <button type="submit" disabled={createMutation.isPending || !text.trim()}>
          Добавить
        </button>
      </form>
    </section>
  );
}
