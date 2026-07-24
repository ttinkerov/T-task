'use client';

import { useMemo, useState } from 'react';
import { useAllTasksQuery } from '@/features/all-tasks/hooks';
import { useDealTasksQuery, useLinkDealTaskMutation, useUnlinkDealTaskMutation } from '../hooks';

export function DealTasksSection({ workspaceId, dealId }: { workspaceId: string; dealId: string }) {
  const { data: links = [], isLoading } = useDealTasksQuery(workspaceId, dealId);
  const { data: allTasks } = useAllTasksQuery(workspaceId, {
    search: '',
    priority: '',
    assigneeId: '',
    boardId: '',
    columnId: '',
    tagId: '',
    status: 'OPEN',
    due: '',
    watching: false,
    page: 1,
    limit: 100,
    sortBy: 'UPDATED_AT',
    sortOrder: 'DESC',
  });
  const linkMutation = useLinkDealTaskMutation(workspaceId, dealId);
  const unlinkMutation = useUnlinkDealTaskMutation(workspaceId, dealId);
  const [taskId, setTaskId] = useState('');

  const linkedIds = useMemo(() => new Set(links.map((link) => link.taskId)), [links]);
  const taskOptions = useMemo(
    () =>
      (allTasks?.items ?? [])
        .filter((task) => !linkedIds.has(task.id))
        .map((task) => ({
          id: task.id,
          label: `${task.title} · ${task.board.name}`,
        })),
    [allTasks?.items, linkedIds],
  );

  return (
    <section className="task-subtasks" aria-labelledby="deal-tasks-title">
      <div className="task-subtasks__header">
        <h3 id="deal-tasks-title">Задачи</h3>
        <span>{links.length}</span>
      </div>

      {isLoading ? <p role="status">Загрузка связей...</p> : null}

      {links.length === 0 && !isLoading ? (
        <p className="task-tags__empty">Нет связанных задач</p>
      ) : (
        <ul className="task-subtasks__list" role="list">
          {links.map((link) => (
            <li key={link.taskId}>
              <span className={link.task.completed ? 'is-done' : undefined}>
                {link.task.title}
                <small className="task-deals__meta"> · {link.task.columnName}</small>
              </span>
              <button
                type="button"
                aria-label={`Отвязать задачу ${link.task.title}`}
                disabled={unlinkMutation.isPending}
                onClick={() => unlinkMutation.mutate(link.taskId)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="task-subtasks__create"
        onSubmit={(event) => {
          event.preventDefault();
          if (!taskId) return;
          linkMutation.mutate(taskId, { onSuccess: () => setTaskId('') });
        }}
      >
        <select
          value={taskId}
          onChange={(event) => setTaskId(event.target.value)}
          aria-label="Задача"
        >
          <option value="">Выберите задачу</option>
          {taskOptions.map((task) => (
            <option key={task.id} value={task.id}>
              {task.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!taskId || linkMutation.isPending}>
          Связать
        </button>
      </form>

      {linkMutation.error || unlinkMutation.error ? (
        <p className="text-sm text-red-400" role="alert">
          {(linkMutation.error ?? unlinkMutation.error)?.message}
        </p>
      ) : null}
    </section>
  );
}
