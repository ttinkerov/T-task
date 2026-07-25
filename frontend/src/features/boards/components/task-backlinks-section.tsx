'use client';

import { useTaskBacklinksQuery } from '../hooks';
import type { TaskBacklink } from '../types';
import { FieldHint } from './field-hint';

const EMPTY_BACKLINKS: TaskBacklink[] = [];

export function TaskBacklinksSection({
  workspaceId,
  taskId,
  onOpenTask,
}: {
  workspaceId: string;
  taskId: string;
  onOpenTask: (taskId: string) => void;
}) {
  const backlinksQuery = useTaskBacklinksQuery(workspaceId, taskId);
  const backlinks = backlinksQuery.data ?? EMPTY_BACKLINKS;

  if (!backlinksQuery.isLoading && !backlinksQuery.error && backlinks.length === 0) {
    return null;
  }

  return (
    <section className="task-relations" aria-labelledby="task-backlinks-title">
      <div className="task-relations__heading">
        <div>
          <h3 id="task-backlinks-title" className="task-drawer__section-title">
            Упоминания
            <FieldHint text="Задачи, в описании которых есть [[ссылка]] на эту карточку." />
          </h3>
          <p>Обратные ссылки из описаний других задач.</p>
        </div>
        <span>{backlinks.length}</span>
      </div>

      {backlinksQuery.isLoading ? (
        <p className="task-relations__empty" role="status">
          Загружаем упоминания…
        </p>
      ) : backlinksQuery.error ? (
        <p className="task-relations__error" role="alert">
          Не удалось загрузить упоминания.
        </p>
      ) : (
        <ul className="task-relations__list">
          {backlinks.map((link) => (
            <li key={link.id}>
              <span
                className="task-relations__icon task-relations__icon--relates_to"
                aria-hidden="true"
              >
                ←
              </span>
              <button
                type="button"
                className="task-relations__task"
                onClick={() => onOpenTask(link.id)}
              >
                <span>Упоминает</span>
                <strong>{link.title}</strong>
                <small>{link.columnName}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
