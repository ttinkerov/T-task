'use client';

import { FormEvent, useState } from 'react';
import { useTaskTemplatesQuery } from '@/features/templates';
import { useCreateTaskMutation } from '../../hooks';

export function KanbanColumnAddTaskForm({
  workspaceId,
  boardId,
  columnId,
}: {
  workspaceId: string;
  boardId: string;
  columnId: string;
}) {
  const createMutation = useCreateTaskMutation(workspaceId, boardId);
  const { data: taskTemplates = [] } = useTaskTemplatesQuery(workspaceId);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selected = taskTemplates.find((template) => template.id === templateId);
    const nextTitle = title.trim() || selected?.title?.trim() || '';
    if (!nextTitle) return;
    await createMutation.mutateAsync({
      title: nextTitle,
      columnId,
      ...(templateId ? { templateId } : {}),
    });
    setTitle('');
    setTemplateId('');
  };

  return (
    <form onSubmit={handleSubmit} className="kanban-column__add">
      {taskTemplates.length > 0 ? (
        <select
          className="kanban-column__add-template"
          value={templateId}
          onChange={(event) => {
            const nextId = event.target.value;
            setTemplateId(nextId);
            const selected = taskTemplates.find((template) => template.id === nextId);
            if (selected?.title && !title.trim()) {
              setTitle(selected.title);
            }
          }}
          aria-label="Шаблон задачи"
        >
          <option value="">Без шаблона</option>
          {taskTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      ) : null}
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Задача..."
        className="kanban-column__add-input"
      />
      <button
        type="submit"
        disabled={
          createMutation.isPending ||
          !(title.trim() || taskTemplates.find((template) => template.id === templateId)?.title)
        }
        className="kanban-column__add-btn"
        aria-label="Добавить задачу"
      >
        +
      </button>
    </form>
  );
}
