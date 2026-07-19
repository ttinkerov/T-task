'use client';

import { useState } from 'react';
import {
  useCreateSubtaskMutation,
  useDeleteSubtaskMutation,
  useSubtasksQuery,
  useUpdateSubtaskMutation,
} from '@/features/subtasks/hooks';

export function TaskSubtasksSection({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const { data: subtasks = [], isLoading } = useSubtasksQuery(workspaceId, taskId);
  const createMutation = useCreateSubtaskMutation(workspaceId, taskId);
  const updateMutation = useUpdateSubtaskMutation(workspaceId, taskId);
  const deleteMutation = useDeleteSubtaskMutation(workspaceId, taskId);
  const [title, setTitle] = useState('');

  const completed = subtasks.filter((item) => item.completed).length;

  return (
    <section className="task-subtasks" aria-labelledby="task-subtasks-title">
      <div className="task-subtasks__header">
        <h3 id="task-subtasks-title">Подзадачи</h3>
        <span>
          {completed}/{subtasks.length}
        </span>
      </div>

      {isLoading ? <p role="status">Загрузка подзадач...</p> : null}

      <ul className="task-subtasks__list" role="list">
        {subtasks.map((subtask) => (
          <li key={subtask.id}>
            <label>
              <input
                type="checkbox"
                checked={subtask.completed}
                disabled={updateMutation.isPending}
                onChange={(event) =>
                  updateMutation.mutate({
                    subtaskId: subtask.id,
                    data: { completed: event.target.checked },
                  })
                }
              />
              <span className={subtask.completed ? 'is-done' : undefined}>{subtask.title}</span>
            </label>
            <button
              type="button"
              aria-label={`Удалить подзадачу ${subtask.title}`}
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(subtask.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form
        className="task-subtasks__create"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          createMutation.mutate(title.trim(), { onSuccess: () => setTitle('') });
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Новая подзадача"
          maxLength={200}
          aria-label="Название подзадачи"
        />
        <button type="submit" disabled={createMutation.isPending || !title.trim()}>
          Добавить
        </button>
      </form>
    </section>
  );
}
