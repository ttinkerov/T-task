'use client';

import {
  PRIORITY_OPTIONS,
  TaskDetailDrawer,
  TaskDisplayView,
  TaskViewToolbar,
  type BoardColumn,
  type BoardViewMode,
} from '@/features/boards';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { useEffect, useMemo, useState } from 'react';
import { useAllTasksQuery } from '../hooks';
import {
  EMPTY_ALL_TASKS_FILTERS,
  type AllTask,
  type AllTasksFilters,
  type AllTasksQuery,
  type AllTasksSort,
  type SortOrder,
} from '../types';

const VIEW_MODES: BoardViewMode[] = ['LIST', 'WEEK', 'MONTH', 'GANTT'];
const PAGE_SIZE = 50;

export function AllTasksPage({
  workspaceId,
  initialTaskId = null,
}: {
  workspaceId: string;
  initialTaskId?: string | null;
}) {
  const storageKey = `all-tasks:view:${workspaceId}`;
  const [filters, setFilters] = useState<AllTasksFilters>(EMPTY_ALL_TASKS_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<AllTasksSort>('CREATED_AT');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [viewMode, setViewMode] = useState<BoardViewMode>('LIST');
  const [viewAnchor, setViewAnchor] = useState(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput.trim() }));
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey) as BoardViewMode | null;
      if (saved && VIEW_MODES.includes(saved)) setViewMode(saved);
    } catch (error) {
      console.warn('Не удалось восстановить режим всех задач', error);
    }
  }, [storageKey]);

  const query: AllTasksQuery = {
    ...filters,
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  const { data, isLoading, isFetching, isError } = useAllTasksQuery(workspaceId, query);
  const { data: members = [] } = useMembersQuery(workspaceId);

  useEffect(() => {
    if (!initialTaskId || !data?.items.some((task) => task.id === initialTaskId)) {
      return;
    }
    setSelectedTaskId(initialTaskId);
  }, [data?.items, initialTaskId]);

  const columns = useMemo(() => buildDisplayColumns(data?.items ?? []), [data?.items]);
  const selectedTask = data?.items.find((task) => task.id === selectedTaskId) ?? null;
  const relationCandidates = useMemo(
    () =>
      (data?.items ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        columnName: `${task.board.name} · ${task.column.name}`,
        completed: Boolean(task.completedAt),
      })),
    [data?.items],
  );
  const availableColumns =
    data?.boards.find((board) => board.id === filters.boardId)?.columns ?? [];

  const changeFilters = (next: AllTasksFilters) => {
    setFilters(next);
    setPage(1);
  };

  const changeViewMode = (mode: BoardViewMode) => {
    if (!VIEW_MODES.includes(mode)) return;
    setViewMode(mode);
    try {
      window.localStorage.setItem(storageKey, mode);
    } catch (error) {
      console.warn('Не удалось сохранить режим всех задач', error);
    }
  };

  return (
    <section className="all-tasks" aria-labelledby="all-tasks-title">
      <header className="all-tasks__header">
        <div>
          <p className="all-tasks__eyebrow">Рабочее пространство</p>
          <h1 id="all-tasks-title">Все задачи</h1>
          <p>Задачи со всех доступных досок в одном месте.</p>
        </div>
        <strong>{data?.total ?? 0} задач</strong>
      </header>

      <TaskViewToolbar
        mode={viewMode}
        modes={VIEW_MODES}
        anchor={viewAnchor}
        onModeChange={changeViewMode}
        onAnchorChange={setViewAnchor}
      />

      <fieldset className="all-tasks__filters">
        <legend className="sr-only">Фильтры и сортировка задач</legend>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Поиск по названию и описанию..."
          aria-label="Поиск задач"
        />
        <select
          value={filters.boardId}
          onChange={(event) =>
            changeFilters({ ...filters, boardId: event.target.value, columnId: '' })
          }
          aria-label="Фильтр по доске"
        >
          <option value="">Все доски</option>
          {data?.boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
        <select
          value={filters.columnId}
          onChange={(event) => changeFilters({ ...filters, columnId: event.target.value })}
          disabled={!filters.boardId}
          aria-label="Фильтр по колонке"
        >
          <option value="">Все колонки</option>
          {availableColumns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </select>
        <select
          value={filters.assigneeId}
          onChange={(event) => changeFilters({ ...filters, assigneeId: event.target.value })}
          aria-label="Фильтр по исполнителю"
        >
          <option value="">Все исполнители</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.user.name}
            </option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(event) =>
            changeFilters({
              ...filters,
              priority: event.target.value as AllTasksFilters['priority'],
            })
          }
          aria-label="Фильтр по приоритету"
        >
          <option value="">Все приоритеты</option>
          {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(event) =>
            changeFilters({ ...filters, status: event.target.value as AllTasksFilters['status'] })
          }
          aria-label="Фильтр по статусу"
        >
          <option value="">Все статусы</option>
          <option value="OPEN">Открытые</option>
          <option value="COMPLETED">Завершённые</option>
        </select>
        <select
          value={filters.due}
          onChange={(event) =>
            changeFilters({ ...filters, due: event.target.value as AllTasksFilters['due'] })
          }
          aria-label="Фильтр по сроку"
        >
          <option value="">Любой срок</option>
          <option value="OVERDUE">Просроченные</option>
          <option value="UPCOMING">Предстоящие</option>
          <option value="NO_DUE">Без срока</option>
        </select>
        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(event) => {
            const [nextSort, nextOrder] = event.target.value.split(':') as [
              AllTasksSort,
              SortOrder,
            ];
            setSortBy(nextSort);
            setSortOrder(nextOrder);
            setPage(1);
          }}
          aria-label="Сортировка задач"
        >
          <option value="CREATED_AT:DESC">Сначала новые</option>
          <option value="UPDATED_AT:DESC">Недавно изменённые</option>
          <option value="DUE_DATE:ASC">Ближайший срок</option>
          <option value="PRIORITY:DESC">По приоритету</option>
          <option value="TITLE:ASC">По названию</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setSearchInput('');
            changeFilters(EMPTY_ALL_TASKS_FILTERS);
          }}
        >
          Сбросить
        </button>
      </fieldset>

      {isLoading ? <p role="status">Загрузка задач...</p> : null}
      {isError ? <p className="all-tasks__error">Не удалось загрузить задачи.</p> : null}
      {data && !isError ? (
        <div
          aria-busy={isFetching}
          className={
            isFetching ? 'all-tasks__content all-tasks__content--loading' : 'all-tasks__content'
          }
        >
          {isFetching ? <span className="sr-only">Обновление списка задач</span> : null}
          <TaskDisplayView
            mode={viewMode as Exclude<BoardViewMode, 'BOARD'>}
            columns={columns}
            anchor={viewAnchor}
            onOpenTask={setSelectedTaskId}
          />
        </div>
      ) : null}

      {data && data.totalPages > 1 ? (
        <nav className="all-tasks__pagination" aria-label="Страницы задач">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Назад
          </button>
          <span>
            Страница {page} из {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Вперёд
          </button>
        </nav>
      ) : null}

      {selectedTask ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={`${selectedTask.board.name} · ${selectedTask.column.name}`}
          relationCandidates={relationCandidates}
          onOpenTask={setSelectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </section>
  );
}

function buildDisplayColumns(tasks: AllTask[]): BoardColumn[] {
  const grouped = new Map<string, BoardColumn>();

  tasks.forEach((task) => {
    const key = `${task.board.id}:${task.column.id}`;
    const current = grouped.get(key);
    grouped.set(key, {
      id: key,
      name: `${task.board.name} · ${task.column.name}`,
      position: current?.position ?? grouped.size,
      automations: [],
      tasks: [...(current?.tasks ?? []), task],
    });
  });

  return Array.from(grouped.values());
}
