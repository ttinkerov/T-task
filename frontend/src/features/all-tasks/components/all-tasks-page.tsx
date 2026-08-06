'use client';

import {
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  TaskDisplayView,
  TaskViewToolbar,
  type BoardColumn,
  type BoardFilters,
  type BoardViewMode,
  type CalendarRange,
  normalizeBoardViewMode,
  normalizeCalendarRange,
  calendarRangeFromStoredView,
} from '@/features/boards';
import { SavedFiltersControl } from '@/features/saved-filters/components/saved-filters-control';
import { downloadExport } from '@/features/workspace-tools/api';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { VueIsland } from '@/components/vue/VueIsland';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AllTasksFiltersView from '@/vue/all-tasks/AllTasksFilters.vue';
import AllTasksList from '@/vue/all-tasks/AllTasksList.vue';
import { useAllTasksMetaQuery, useAllTasksQuery } from '../hooks';
import {
  EMPTY_ALL_TASKS_FILTERS,
  type AllTask,
  type AllTasksFilters,
  type AllTasksQuery,
  type AllTasksSort,
  type SortOrder,
} from '../types';

const TaskDetailDrawer = dynamic(
  () =>
    import('@/features/boards/components/task-detail-drawer').then((mod) => ({
      default: mod.TaskDetailDrawer,
    })),
  { ssr: false },
);

const VIEW_MODES: BoardViewMode[] = ['TABLE', 'CALENDAR', 'TIMELINE'];
const PAGE_SIZE = 50;

export function AllTasksPage({
  workspaceId,
  initialTaskId = null,
  lockedAssigneeId = null,
  title = 'Все задачи',
  description = 'Задачи со всех доступных досок в одном месте.',
  linkSource = 'all-tasks',
}: {
  workspaceId: string;
  initialTaskId?: string | null;
  lockedAssigneeId?: string | null;
  title?: string;
  description?: string;
  linkSource?: 'all-tasks' | 'my-tasks';
}) {
  const storageKey = `all-tasks:view:${workspaceId}:${lockedAssigneeId ? 'mine' : 'all'}`;
  const [filters, setFilters] = useState<AllTasksFilters>({
    ...EMPTY_ALL_TASKS_FILTERS,
    ...(lockedAssigneeId ? { assigneeId: lockedAssigneeId } : {}),
  });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<AllTasksSort>('CREATED_AT');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [viewMode, setViewMode] = useState<BoardViewMode>('TABLE');
  const [calendarRange, setCalendarRange] = useState<CalendarRange>('WEEK');
  const [viewAnchor, setViewAnchor] = useState(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [savedFiltersHost, setSavedFiltersHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput.trim() }));
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const mode = normalizeBoardViewMode(saved);
      if (mode && VIEW_MODES.includes(mode)) setViewMode(mode);
      const rangeKey = `${storageKey}:calendar-range`;
      const storedRange = window.localStorage.getItem(rangeKey);
      setCalendarRange(
        normalizeCalendarRange(storedRange) ?? calendarRangeFromStoredView(saved) ?? 'WEEK',
      );
    } catch (error) {
      console.warn('Не удалось восстановить режим всех задач', error);
    }
  }, [storageKey]);

  const query: AllTasksQuery = {
    ...filters,
    assigneeId: lockedAssigneeId ?? filters.assigneeId,
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  const { data, isLoading, isFetching, isError } = useAllTasksQuery(workspaceId, query);
  const { data: filterMeta } = useAllTasksMetaQuery(workspaceId);
  const { data: members = [] } = useMembersQuery(workspaceId);
  const filterBoards = filterMeta?.boards ?? [];
  const filterTags = filterMeta?.tags ?? [];

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
        isEpic: Boolean(task.isEpic),
      })),
    [data?.items],
  );
  const availableColumns =
    filterBoards.find((board) => board.id === filters.boardId)?.columns ?? [];

  const listRows = useMemo(
    () =>
      (data?.items ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        columnName: `${task.board.name} · ${task.column.name}`,
        assigneeName: task.assignee?.name ?? 'Не назначен',
        priorityLabel: task.priority ? PRIORITY_LABELS[task.priority] : '—',
        dueDate: task.dueDate,
      })),
    [data?.items],
  );

  const savedFilterView = lockedAssigneeId ? 'MY_TASKS' : 'ALL_TASKS';
  const boardFiltersForSave = useMemo(
    () => allTasksFiltersToBoardFilters(filters, Boolean(lockedAssigneeId)),
    [filters, lockedAssigneeId],
  );

  const applySavedBoardFiltersSafe = useCallback(
    (next: BoardFilters) => {
      setSearchInput(next.search);
      setPage(1);
      setFilters((current) => applyBoardFiltersToAllTasks(current, next, lockedAssigneeId));
    },
    [lockedAssigneeId],
  );

  const changeViewMode = (mode: BoardViewMode) => {
    if (!VIEW_MODES.includes(mode)) return;
    setViewMode(mode);
    try {
      window.localStorage.setItem(storageKey, mode);
    } catch (error) {
      console.warn('Не удалось сохранить режим всех задач', error);
    }
  };

  const changeCalendarRange = (range: CalendarRange) => {
    setCalendarRange(range);
    try {
      window.localStorage.setItem(`${storageKey}:calendar-range`, range);
    } catch (error) {
      console.warn('Не удалось сохранить период календаря', error);
    }
  };

  const onOpenTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const onPageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const onSavedHostReady = useCallback((el: HTMLElement | null) => {
    setSavedFiltersHost(el);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const onFiltersChange = useCallback((next: AllTasksFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const onSortChange = useCallback((value: string) => {
    const [nextSort, nextOrder] = value.split(':') as [AllTasksSort, SortOrder];
    setSortBy(nextSort);
    setSortOrder(nextOrder);
    setPage(1);
  }, []);

  const onResetFilters = useCallback(() => {
    setSearchInput('');
    setFilters({
      ...EMPTY_ALL_TASKS_FILTERS,
      ...(lockedAssigneeId ? { assigneeId: lockedAssigneeId } : {}),
    });
    setPage(1);
  }, [lockedAssigneeId]);

  const onExport = useCallback(() => {
    void downloadExport(workspaceId, 'tasks');
  }, [workspaceId]);

  const priorityOptions = useMemo(() => PRIORITY_OPTIONS.filter((option) => option.value), []);

  const filterProps = useMemo(
    () => ({
      searchInput,
      filters,
      sortValue: `${sortBy}:${sortOrder}`,
      boards: filterBoards,
      columns: availableColumns,
      members,
      tags: filterTags,
      priorityOptions,
      assigneeLocked: Boolean(lockedAssigneeId),
      onSearchChange,
      onFiltersChange,
      onSortChange,
      onReset: onResetFilters,
      onExport,
      onSavedHostReady,
    }),
    [
      searchInput,
      filters,
      sortBy,
      sortOrder,
      filterBoards,
      availableColumns,
      members,
      filterTags,
      priorityOptions,
      lockedAssigneeId,
      onSearchChange,
      onFiltersChange,
      onSortChange,
      onResetFilters,
      onExport,
      onSavedHostReady,
    ],
  );

  const listProps = useMemo(
    () => ({
      rows: listRows,
      isLoading,
      isError,
      isFetching,
      page,
      totalPages: data?.totalPages ?? 1,
      onOpenTask,
      onPageChange,
    }),
    [listRows, isLoading, isError, isFetching, page, data?.totalPages, onOpenTask, onPageChange],
  );

  return (
    <section className="all-tasks" aria-labelledby="all-tasks-title">
      <header className="all-tasks__header">
        <div>
          <p className="all-tasks__eyebrow">Рабочее пространство</p>
          <h1 id="all-tasks-title">{title}</h1>
          <p>{description}</p>
        </div>
        <strong>{data?.total ?? 0} задач</strong>
      </header>

      <TaskViewToolbar
        mode={viewMode}
        modes={VIEW_MODES}
        anchor={viewAnchor}
        calendarRange={calendarRange}
        onModeChange={changeViewMode}
        onAnchorChange={setViewAnchor}
        onCalendarRangeChange={changeCalendarRange}
      />

      <VueIsland component={AllTasksFiltersView} componentProps={filterProps} />
      {savedFiltersHost
        ? createPortal(
            <SavedFiltersControl
              workspaceId={workspaceId}
              view={savedFilterView}
              filters={boardFiltersForSave}
              onApply={applySavedBoardFiltersSafe}
            />,
            savedFiltersHost,
          )
        : null}

      {viewMode === 'TABLE' ? (
        <VueIsland component={AllTasksList} componentProps={listProps} />
      ) : (
        <>
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
                calendarRange={calendarRange}
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
        </>
      )}

      {selectedTask ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={`${selectedTask.board.name} · ${selectedTask.column.name}`}
          relationCandidates={relationCandidates}
          linkSource={linkSource}
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
      wipLimit: null,
      automations: [],
      tasks: [...(current?.tasks ?? []), task],
    });
  });

  return Array.from(grouped.values());
}

function allTasksFiltersToBoardFilters(
  filters: AllTasksFilters,
  myTasksOnly: boolean,
): BoardFilters {
  return {
    search: filters.search,
    priority: filters.priority,
    assigneeId: filters.assigneeId,
    tagId: filters.tagId,
    myTasksOnly,
    overdueStatus: filters.due === 'OVERDUE' ? 'overdue' : '',
    sprintId: '',
    epicId: '',
  };
}

function applyBoardFiltersToAllTasks(
  current: AllTasksFilters,
  boardFilters: BoardFilters,
  lockedAssigneeId: string | null,
): AllTasksFilters {
  return {
    ...current,
    search: boardFilters.search,
    priority: boardFilters.priority,
    assigneeId: lockedAssigneeId ?? boardFilters.assigneeId,
    tagId: boardFilters.tagId,
    due: boardFilters.overdueStatus === 'overdue' ? 'OVERDUE' : '',
  };
}
