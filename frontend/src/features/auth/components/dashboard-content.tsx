'use client';

import { useMeQuery } from '@/features/auth/hooks';
import { EMPTY_ALL_TASKS_FILTERS, useAllTasksQuery, useMyTasksQuery } from '@/features/all-tasks';
import { MyTasksSection } from '@/features/all-tasks/components/my-tasks-section';
import {
  buildHomeDashboardSlices,
  HOME_SECTION_LIMIT,
} from '@/features/all-tasks/lib/home-dashboard-slices';
import { DUE_SOON_DAYS } from '@/features/all-tasks/lib/my-tasks-partition';
import type { AllTask, AllTasksQuery } from '@/features/all-tasks/types';
import { CreateWorkspaceForm } from '@/features/workspaces/components/create-workspace-form';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const TaskDetailDrawer = dynamic(
  () =>
    import('@/features/boards/components/task-detail-drawer').then((mod) => ({
      default: mod.TaskDetailDrawer,
    })),
  { ssr: false },
);

const QUICK_LINKS = [
  { href: '/dashboard/board', label: 'Доска' },
  { href: '/dashboard/my-tasks', label: 'Мои задачи' },
  { href: '/dashboard/crm', label: 'CRM' },
  { href: '/dashboard/focus', label: 'Pomodoro' },
  { href: '/dashboard/forms', label: 'Формы' },
  { href: '/dashboard/analytics', label: 'Аналитика' },
] as const;

export function DashboardContent() {
  const { data: session } = useMeQuery();
  const { data: workspaces = [] } = useWorkspacesQuery();
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const currentWorkspace = workspaces.find((workspace) => workspace.id === currentWorkspaceId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const myTasksQuery = useMyTasksQuery(currentWorkspaceId, 50);

  const recentQueryParams = useMemo<AllTasksQuery>(
    () => ({
      ...EMPTY_ALL_TASKS_FILTERS,
      assigneeId: session?.user.id ?? '',
      status: 'OPEN',
      page: 1,
      limit: HOME_SECTION_LIMIT,
      sortBy: 'UPDATED_AT',
      sortOrder: 'DESC',
    }),
    [session?.user.id],
  );

  const recentQuery = useAllTasksQuery(
    session?.user.id && currentWorkspaceId ? currentWorkspaceId : null,
    recentQueryParams,
  );

  const buckets = myTasksQuery.data ?? {
    overdue: [] as AllTask[],
    dueSoon: [] as AllTask[],
    assigned: [] as AllTask[],
    watching: [] as AllTask[],
  };
  const dueSoonDays = myTasksQuery.data?.dueSoonDays ?? DUE_SOON_DAYS;

  const slices = useMemo(
    () => buildHomeDashboardSlices(buckets, recentQuery.data?.items ?? [], HOME_SECTION_LIMIT),
    [buckets, recentQuery.data?.items],
  );

  const tasksById = useMemo(() => {
    const map = new Map<string, AllTask>();
    for (const task of [
      ...buckets.overdue,
      ...buckets.dueSoon,
      ...buckets.assigned,
      ...buckets.watching,
      ...(recentQuery.data?.items ?? []),
    ]) {
      map.set(task.id, task);
    }
    return map;
  }, [buckets, recentQuery.data?.items]);

  const selectedTask = selectedTaskId ? (tasksById.get(selectedTaskId) ?? null) : null;
  const relationCandidates = useMemo(
    () =>
      Array.from(tasksById.values()).map((task) => ({
        id: task.id,
        title: task.title,
        columnName: `${task.board.name} · ${task.column.name}`,
        completed: Boolean(task.completedAt),
        isEpic: Boolean(task.isEpic),
      })),
    [tasksById],
  );

  if (!session) {
    return null;
  }

  const isLoading = myTasksQuery.isLoading;
  const isError = myTasksQuery.isError;
  const hasWorkspace = Boolean(currentWorkspaceId);

  return (
    <section className="home-dashboard" aria-labelledby="home-dashboard-title">
      <header className="home-dashboard__header">
        <div>
          <h1 id="home-dashboard-title" className="tt-logo" style={{ fontSize: '1.5rem' }}>
            Добро пожаловать, {session.user.name}
          </h1>
          <p>Что сделать дальше — просрочки, ближайшие дедлайны и недавние задачи.</p>
        </div>
        <div className="home-dashboard__header-actions">
          <Link href="/dashboard/my-tasks" className="btn-ghost text-sm">
            Все мои задачи
          </Link>
          <Link href="/dashboard/board" className="btn-primary text-sm">
            Открыть доску
          </Link>
        </div>
      </header>

      {!hasWorkspace ? (
        <p className="home-dashboard__hint">Выберите или создайте команду, чтобы увидеть задачи.</p>
      ) : null}

      {hasWorkspace && isLoading ? <p role="status">Загрузка задач...</p> : null}
      {hasWorkspace && isError ? (
        <p className="all-tasks__error">Не удалось загрузить задачи.</p>
      ) : null}

      {hasWorkspace && !isLoading && !isError ? (
        <>
          <ul className="home-dashboard__stats" aria-label="Сводка по вашим задачам">
            <li className="home-dashboard__stat home-dashboard__stat--danger">
              <strong>{slices.counts.overdue}</strong>
              <span>Просрочено</span>
            </li>
            <li className="home-dashboard__stat home-dashboard__stat--warn">
              <strong>{slices.counts.dueSoon}</strong>
              <span>Скоро · {dueSoonDays} дн.</span>
            </li>
            <li className="home-dashboard__stat">
              <strong>{slices.counts.assigned}</strong>
              <span>Назначено</span>
            </li>
            <li className="home-dashboard__stat">
              <strong>{slices.counts.open}</strong>
              <span>Открытых</span>
            </li>
          </ul>

          <div className="home-dashboard__grid my-tasks">
            <MyTasksSection
              id="home-overdue"
              title="Просроченные"
              hint="Дедлайн уже прошёл"
              tasks={slices.overdue}
              count={slices.counts.overdue}
              tone="danger"
              emptyLabel="Просрочек нет — отличная работа."
              onOpenTask={setSelectedTaskId}
            />
            <MyTasksSection
              id="home-next"
              title="Дальше"
              hint={`Скоро дедлайн и назначенные вам`}
              tasks={slices.nextActions}
              count={slices.counts.dueSoon + slices.counts.assigned}
              tone="warn"
              emptyLabel="Нет ближайших действий — возьмите задачу с доски."
              onOpenTask={setSelectedTaskId}
            />
            <MyTasksSection
              id="home-recent"
              title="Недавние"
              hint="Недавно обновлённые"
              tasks={slices.recent}
              emptyLabel="Пока нет недавних задач."
              onOpenTask={setSelectedTaskId}
            />
          </div>
        </>
      ) : null}

      <nav className="home-dashboard__links" aria-label="Быстрые ссылки">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="home-dashboard__link">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="glass-panel space-y-3 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-muted-foreground">Активная команда</h2>
        <WorkspaceSwitcher />
        {currentWorkspace ? (
          <p className="text-sm text-muted-foreground">
            Роль: <span className="font-medium text-foreground">{currentWorkspace.role}</span>
          </p>
        ) : null}
        <CreateWorkspaceForm />
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <h2 className="text-sm font-medium text-muted-foreground">Все команды</h2>
        <ul className="mt-3 space-y-2">
          {workspaces.map((workspace) => (
            <li
              key={workspace.id}
              className="flex items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2"
            >
              <div>
                <p className="font-medium">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">{workspace.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {workspace.role}
                </span>
                <Link
                  href={`/dashboard/workspaces/${workspace.id}/settings`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Настройки
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedTask && currentWorkspaceId ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={currentWorkspaceId}
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
