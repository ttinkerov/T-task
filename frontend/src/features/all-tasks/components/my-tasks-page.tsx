'use client';

import { PRIORITY_LABELS } from '@/features/boards';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useMyTasksQuery } from '../hooks';
import { DUE_SOON_DAYS } from '../lib/my-tasks-partition';
import type { AllTask } from '../types';

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
  userId: _userId,
  initialTaskId = null,
}: {
  workspaceId: string;
  userId: string;
  initialTaskId?: string | null;
}) {
  const myTasks = useMyTasksQuery(workspaceId, SECTION_LIMIT);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);

  const buckets = myTasks.data ?? {
    overdue: [] as AllTask[],
    dueSoon: [] as AllTask[],
    assigned: [] as AllTask[],
    watching: [] as AllTask[],
  };
  const dueSoonDays = myTasks.data?.dueSoonDays ?? DUE_SOON_DAYS;

  const allTasksById = useMemo(() => {
    const map = new Map<string, AllTask>();
    for (const task of [
      ...buckets.overdue,
      ...buckets.dueSoon,
      ...buckets.assigned,
      ...buckets.watching,
    ]) {
      map.set(task.id, task);
    }
    return map;
  }, [buckets.assigned, buckets.dueSoon, buckets.overdue, buckets.watching]);

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

  const isLoading = myTasks.isLoading;
  const isError = myTasks.isError;

  return (
    <section className="all-tasks my-tasks" aria-labelledby="my-tasks-title">
      <header className="all-tasks__header">
        <div>
          <p className="all-tasks__eyebrow">Личное</p>
          <h1 id="my-tasks-title">Мои задачи</h1>
          <p>
            Как Notion «Assigned to me»: просроченные, ближайшие {dueSoonDays} дней, назначенные вам
            и те, за которыми вы следите.
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
        hint={`В ближайшие ${dueSoonDays} дней`}
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
