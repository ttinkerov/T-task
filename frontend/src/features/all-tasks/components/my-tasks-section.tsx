'use client';

import { PRIORITY_LABELS } from '@/features/boards';
import type { AllTask } from '../types';

export function MyTasksSection({
  id,
  title,
  hint,
  tasks,
  tone,
  emptyLabel,
  count,
  onOpenTask,
}: {
  id: string;
  title: string;
  hint: string;
  tasks: AllTask[];
  tone?: 'danger' | 'warn';
  emptyLabel?: string;

  count?: number;
  onOpenTask: (taskId: string) => void;
}) {
  if (tasks.length === 0 && !emptyLabel) return null;

  return (
    <section
      className={`my-tasks__section${tone ? ` my-tasks__section--${tone}` : ''}`}
      aria-labelledby={`my-tasks-${id}`}
    >
      <header className="my-tasks__section-head">
        <div>
          <h2 id={`my-tasks-${id}`}>{title}</h2>
          <p>{hint}</p>
        </div>
        <span>{count ?? tasks.length}</span>
      </header>
      {tasks.length === 0 ? (
        <p className="my-tasks__empty">{emptyLabel}</p>
      ) : (
        <ul className="my-tasks__list" role="list">
          {tasks.map((task) => (
            <li key={task.id}>
              <button type="button" className="my-tasks__row" onClick={() => onOpenTask(task.id)}>
                <span className="my-tasks__row-main">
                  <strong>{task.title}</strong>
                  <small>
                    {task.board.name} · {task.column.name}
                    {task.priority ? ` · ${PRIORITY_LABELS[task.priority]}` : ''}
                  </small>
                </span>
                <time dateTime={task.dueDate ?? undefined}>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Без срока'}
                </time>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
