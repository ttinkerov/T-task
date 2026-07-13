'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useDeleteTaskMutation, useUpdateTaskMutation } from '../hooks';
import { COMPLEXITY_OPTIONS, PRIORITY_OPTIONS, type BoardTask, type TaskPriority } from '../types';

interface TaskDetailDrawerProps {
  workspaceId: string;
  task: BoardTask;
  columnName: string;
  onClose: () => void;
}

export function TaskDetailDrawer({
  workspaceId,
  task,
  columnName,
  onClose,
}: TaskDetailDrawerProps) {
  const updateMutation = useUpdateTaskMutation(workspaceId);
  const deleteMutation = useDeleteTaskMutation(workspaceId);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<TaskPriority | ''>(task.priority ?? '');
  const [complexity, setComplexity] = useState<number | ''>(task.complexity ?? '');
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority ?? '');
    setComplexity(task.complexity ?? '');
    setDueDate(toDateInputValue(task.dueDate));
  }, [task]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    await updateMutation.mutateAsync({
      taskId: task.id,
      data: {
        title: title.trim(),
        description: description.trim() || null,
        priority: priority || null,
        complexity: complexity === '' ? null : Number(complexity),
        dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
      },
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(task.id);
    onClose();
  };

  return (
    <div className="task-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="task-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Редактирование задачи"
      >
        <div className="task-drawer__header">
          <div>
            <p className="task-drawer__eyebrow">{columnName}</p>
            <h2 className="task-drawer__heading">Задача</h2>
          </div>
          <button
            type="button"
            className="dashboard-header__icon-btn"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-drawer__form">
          <label className="task-drawer__field">
            <span>Название</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="glass-input"
              required
              maxLength={200}
              autoFocus
            />
          </label>

          <label className="task-drawer__field">
            <span>Описание</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="glass-input task-drawer__textarea"
              rows={5}
              maxLength={2000}
              placeholder="Подробности задачи..."
            />
          </label>

          <div className="task-drawer__grid">
            <label className="task-drawer__field">
              <span>Приоритет</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority | '')}
                className="glass-input"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="task-drawer__field">
              <span>Сложность</span>
              <select
                value={complexity}
                onChange={(event) =>
                  setComplexity(event.target.value === '' ? '' : Number(event.target.value))
                }
                className="glass-input"
              >
                {COMPLEXITY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="task-drawer__field">
            <span>Дедлайн</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="glass-input"
            />
          </label>

          {updateMutation.error ? (
            <p className="text-sm text-red-400">{updateMutation.error.message}</p>
          ) : null}

          <div className="task-drawer__actions">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn-ghost task-drawer__danger"
            >
              Удалить
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !title.trim()}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function toDateInputValue(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}
