'use client';

import { PRIORITY_LABELS } from '@/features/boards';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useAllTasksQuery } from '../hooks';
import { DUE_SOON_DAYS, partitionMyTasks } from '../lib/my-tasks-partition';
import { EMPTY_ALL_TASKS_FILTERS, type AllTask, type AllTasksQuery } from '../types';

const TaskDetailDrawer = dynamic(
  () =>
    import('@/features/boards/components/task-detail-drawer').then((mod) => ({
      default: mod.TaskDetailDrawer,
    })),
  { ssr: false },
);

const SECTION_LIMIT = 50;

export function MyTasksPage({
  workspaceId,
  userId,
  initialTaskId = null,
}: {
  workspaceId: string;
  userId: string;
  initialTaskId?: string | null;
}) {
  const assignedQuery: AllTasksQuery = {
    ...EMPTY_ALL_TASKS_FILTERS,
    assigneeId: userId,
    status: 'OPEN',
    page: 1,
    limit: SECTION_LIMIT,
    sortBy: 'DUE_DATE',
    sortOrder: 'ASC',
  };
  const watchingQuery: AllTasksQuery = {
    ...EMPTY_ALL_TASKS_FILTERS,
    watching: true,
    status: 'OPEN',
    page: 1,
    limit: SECTION_LIMIT,
    sortBy: 'DUE_DATE',
    sortOrder: 'ASC',
  };

  const assigned = useAllTasksQuery(workspaceId, assignedQuery);
  const watching = useAllTasksQuery(workspaceId, watchingQuery);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);

  const buckets = useMemo(
    () => partitionMyTasks(assigned.data?.items ?? [], watching.data?.items ?? []),
    [assigned.data?.items, watching.data?.items],
  );

  const allTasksById = useMemo(() => {
    const map = new Map<string, AllTask>();
    for (const task of [...(assigned.data?.items ?? []), ...(watching.data?.items ?? [])]) {
      map.set(task.id, task);
    }
    return map;
  }, [assigned.data?.items, watching.data?.items]);

  const selectedTask = selectedTaskId ? (allTasksById.get(selectedTaskId) ?? null) : null;
  const relationCandidates = useMemo(
    () =>
      Array.from(allTasksById.values()).map((task) => ({
        id: task.id,
        title: task.title,
        columnName: `${task.board.name} · ${task.column.name}`,
        completed: Boolean(task.completedAt),
        isEpic: Boolean(task.isEpic),
      })),
    [allTasksById],
  );

  const totalVisible =
    buckets.overdue.length +
    buckets.dueSoon.length +
    buckets.assigned.length +
    buckets.watching.length;

  const isLoading = assigned.isLoading || watching.isLoading;
  const isError = assigned.isError || watching.isError;

  return (
    <section className="all-tasks my-tasks" aria-labelledby="my-tasks-title">
      <header className="all-tasks__header">
        <div>
          <p className="all-tasks__eyebrow">Личное</p>
          <h1 id="my-tasks-title">Мои задачи</h1>
          <p>
            Как Notion «Assigned to me»: просроченные, ближайшие {DUE_SOON_DAYS} дней, назначенные
            вам и те, за которыми вы следите.
          </p>
        </div>
        <strong>{totalVisible} открытых</strong>
      </header>

      {isLoading ? <p role="status">Загрузка задач...</p> : null}
      {isError ? <p className="all-tasks__error">Не удалось загрузить задачи.</p> : null}

      {!isLoading && !isError && totalVisible === 0 ? (
        <p className="my-tasks__empty">
          Пока пусто — назначьте себе задачу или включите «Следить» в карточке.
        </p>
      ) : null}

      <MyTasksSection
        id="overdue"
        title="Просроченные"
        hint="Дедлайн уже прошёл"
        tasks={buckets.overdue}
        tone="danger"
        onOpenTask={setSelectedTaskId}
      />
      <MyTasksSection
        id="dueSoon"
        title="Скоро дедлайн"
        hint={`В ближайшие ${DUE_SOON_DAYS} дней`}
        tasks={buckets.dueSoon}
        tone="warn"
        onOpenTask={setSelectedTaskId}
      />
      <MyTasksSection
        id="assigned"
        title="Назначены мне"
        hint="Без срочного дедлайна"
        tasks={buckets.assigned}
        onOpenTask={setSelectedTaskId}
      />
      <MyTasksSection
        id="watching"
        title="Слежу"
        hint="Вы подписаны, но не исполнитель"
        tasks={buckets.watching}
        onOpenTask={setSelectedTaskId}
      />

      {selectedTask ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={`${selectedTask.board.name} · ${selectedTask.column.name}`}
          relationCandidates={relationCandidates}
          linkSource="my-tasks"
          onOpenTask={setSelectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </section>
  );
}

function MyTasksSection({
  id,
  title,
  hint,
  tasks,
  tone,
  onOpenTask,
}: {
  id: string;
  title: string;
  hint: string;
  tasks: AllTask[];
  tone?: 'danger' | 'warn';
  onOpenTask: (taskId: string) => void;
}) {
  if (tasks.length === 0) return null;

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
        <span>{tasks.length}</span>
      </header>
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
    </section>
  );
}
