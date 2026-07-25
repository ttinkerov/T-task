'use client';

import { useState } from 'react';
import { FieldHint } from '@/features/boards/components/field-hint';
import { useApplyTaskTemplateMutation, useTaskTemplatesQuery } from '../hooks';

export function ApplyTaskTemplateControl({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const { data: templates = [] } = useTaskTemplatesQuery(workspaceId);
  const applyMutation = useApplyTaskTemplateMutation(workspaceId, taskId);
  const [templateId, setTemplateId] = useState('');

  if (templates.length === 0) return null;

  return (
    <div className="task-drawer__field">
      <span className="task-drawer__label">
        Шаблон
        <FieldHint text="Заполнит пустые поля и добавит теги, сабтаски и DoD из шаблона. Уже заполненные поля не перезаписываются." />
      </span>
      <div className="task-checklist__apply" role="group" aria-label="Применить шаблон задачи">
        <select
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          aria-label="Шаблон задачи"
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
          {applyMutation.isPending ? '…' : 'Применить'}
        </button>
      </div>
    </div>
  );
}
