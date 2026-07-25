'use client';

import { SegmentedControl } from '@/components/ui/segmented-control';
import { useAllTasksQuery, EMPTY_ALL_TASKS_FILTERS, type AllTask } from '@/features/all-tasks';
import { useSprintsQuery } from '@/features/sprints';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  buildMonthColumns,
  getBarPlacement,
  getEpicProgress,
  getEpicSpan,
  getRangeEnd,
  startOfMonth,
  todayMarkerPct,
} from '../lib/roadmap-utils';
import type { RoadmapEpic } from '../types';

const TaskDetailDrawer = dynamic(
  () =>
    import('@/features/boards/components/task-detail-drawer').then((mod) => ({
      default: mod.TaskDetailDrawer,
    })),
  { ssr: false },
);

const MONTH_OPTIONS = [
  { value: '3', label: '3 мес.' },
  { value: '6', label: '6 мес.' },
] as const;

const ROADMAP_TASKS_QUERY = {
  ...EMPTY_ALL_TASKS_FILTERS,
  page: 1,
  limit: 100,
  sortBy: 'DUE_DATE',
  sortOrder: 'ASC',
} as const;

export function RoadmapPage({
  workspaceId,
  initialTaskId = null,
}: {
  workspaceId: string;
  initialTaskId?: string | null;
}) {
  const [monthCount, setMonthCount] = useState<3 | 6>(3);
  const [rangeStart, setRangeStart] = useState(() => startOfMonth(new Date()));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data, isLoading, isError } = useAllTasksQuery(workspaceId, {
    ...ROADMAP_TASKS_QUERY,
  });
  const { data: sprints = [] } = useSprintsQuery(workspaceId);

  const items = data?.items ?? [];
  const isTruncated = data != null && data.total > data.limit;

  useEffect(() => {
    if (!initialTaskId || !items.some((task) => task.id === initialTaskId)) {
      return;
    }
    setSelectedTaskId(initialTaskId);
  }, [initialTaskId, items]);

  const rangeEnd = useMemo(() => getRangeEnd(rangeStart, monthCount), [rangeStart, monthCount]);
  const months = useMemo(() => buildMonthColumns(rangeStart, monthCount), [rangeStart, monthCount]);
  const todayPct = todayMarkerPct(rangeStart, rangeEnd);

  const sprintsById = useMemo(() => {
    return Object.fromEntries(sprints.map((sprint) => [sprint.id, sprint]));
  }, [sprints]);

  const { datedEpics, undatedEpics } = useMemo(() => {
    const epics = items.filter((task) => task.isEpic);
    const childrenByEpic = new Map<string, AllTask[]>();

    for (const task of items) {
      if (!task.epicId || task.isEpic) continue;
      const list = childrenByEpic.get(task.epicId) ?? [];
      childrenByEpic.set(task.epicId, [...list, task]);
    }

    const dated: RoadmapEpic[] = [];
    const undated: RoadmapEpic[] = [];

    for (const epic of epics) {
      const children = childrenByEpic.get(epic.id) ?? [];
      const span = getEpicSpan(epic, children, sprintsById);
      const placement = span ? getBarPlacement(span, rangeStart, rangeEnd) : null;
      const entry: RoadmapEpic = {
        epic,
        children,
        span,
        placement,
        progress: getEpicProgress(children),
      };

      if (!span) {
        undated.push(entry);
      } else {
        dated.push(entry);
      }
    }

    dated.sort((a, b) => {
      if (!a.span || !b.span) return 0;
      return a.span.start.getTime() - b.span.start.getTime();
    });

    return { datedEpics: dated, undatedEpics: undated };
  }, [items, rangeEnd, rangeStart, sprintsById]);

  const selectedTask =
    items.find((task) => task.id === selectedTaskId) ??
    datedEpics.find((entry) => entry.epic.id === selectedTaskId)?.epic ??
    undatedEpics.find((entry) => entry.epic.id === selectedTaskId)?.epic ??
    null;

  const relationCandidates = useMemo(
    () =>
      items.map((task) => ({
        id: task.id,
        title: task.title,
        columnName: `${task.board.name} · ${task.column.name}`,
        completed: Boolean(task.completedAt),
        isEpic: Boolean(task.isEpic),
      })),
    [items],
  );

  const rangeLabel = months.length ? `${months[0].label} — ${months[months.length - 1].label}` : '';

  return (
    <section className="roadmap">
      <header className="roadmap__header">
        <div>
          <p className="roadmap__eyebrow">Рядом с видами задач</p>
          <h1>Роадмап</h1>
          <p>Эпики и сроки по месяцам — та же база задач, другой масштаб.</p>
        </div>
        <strong>{datedEpics.length + undatedEpics.length} эпиков</strong>
      </header>

      <div className="task-view-toolbar">
        <SegmentedControl
          size="sm"
          aria-label="Горизонт"
          options={MONTH_OPTIONS}
          value={String(monthCount) as '3' | '6'}
          onChange={(value) => setMonthCount(Number(value) as 3 | 6)}
        />
        <div className="task-view-toolbar__dates">
          <button
            type="button"
            aria-label="Предыдущий период"
            onClick={() => setRangeStart((current) => addMonths(current, -monthCount))}
          >
            ←
          </button>
          <strong>{rangeLabel}</strong>
          <button type="button" onClick={() => setRangeStart(startOfMonth(new Date()))}>
            Сегодня
          </button>
          <button
            type="button"
            aria-label="Следующий период"
            onClick={() => setRangeStart((current) => addMonths(current, monthCount))}
          >
            →
          </button>
        </div>
      </div>

      {isLoading ? <p className="roadmap__status">Загрузка роадмапа...</p> : null}
      {isError ? (
        <p className="roadmap__status roadmap__status--error">Не удалось загрузить задачи.</p>
      ) : null}
      {isTruncated ? (
        <p className="roadmap__status">
          Показаны первые {data.limit} задач из {data.total} — часть эпиков может не попасть в
          ленту.
        </p>
      ) : null}

      {!isLoading && !isError && datedEpics.length === 0 && undatedEpics.length === 0 ? (
        <div className="roadmap__empty">
          <h2>Пока нет эпиков</h2>
          <p>Отметьте задачу как эпик в карточке — она появится здесь как дорожка.</p>
        </div>
      ) : null}

      {datedEpics.length > 0 ? (
        <div className="roadmap__scroll">
          <div
            className="roadmap__grid"
            style={{ ['--roadmap-months' as string]: String(monthCount) }}
          >
            <div className="roadmap__axis-spacer" aria-hidden />
            <div
              className="roadmap__axis"
              role="row"
              style={{ gridTemplateColumns: `repeat(${monthCount}, minmax(0, 1fr))` }}
            >
              {months.map((month) => (
                <div key={month.key} className="roadmap__month" role="columnheader">
                  {month.label}
                </div>
              ))}
              {todayPct != null ? (
                <span className="roadmap__today" style={{ left: `${todayPct}%` }} aria-hidden />
              ) : null}
            </div>

            {datedEpics.map((entry) => (
              <RoadmapLane
                key={entry.epic.id}
                entry={entry}
                todayPct={todayPct}
                onOpen={() => setSelectedTaskId(entry.epic.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {undatedEpics.length > 0 ? (
        <section className="roadmap__undated">
          <h2>Без дат</h2>
          <div>
            {undatedEpics.map((entry) => (
              <button
                key={entry.epic.id}
                type="button"
                className="roadmap__undated-item"
                onClick={() => setSelectedTaskId(entry.epic.id)}
              >
                <strong>{entry.epic.title}</strong>
                <span>
                  {entry.progress.total > 0
                    ? `${entry.progress.done}/${entry.progress.total}`
                    : 'Нет дочерних'}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedTask ? (
        <TaskDetailDrawer
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={`${selectedTask.board.name} · ${selectedTask.column.name}`}
          relationCandidates={relationCandidates}
          linkSource="all-tasks"
          onOpenTask={(taskId) => setSelectedTaskId(taskId)}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </section>
  );
}

function RoadmapLane({
  entry,
  todayPct,
  onOpen,
}: {
  entry: RoadmapEpic;
  todayPct: number | null;
  onOpen: () => void;
}) {
  const priority = entry.epic.priority;
  const progressLabel =
    entry.progress.total > 0 ? `${entry.progress.done}/${entry.progress.total}` : '0/0';
  const progressPct =
    entry.progress.total > 0 ? Math.round((entry.progress.done / entry.progress.total) * 100) : 0;

  return (
    <>
      <button type="button" className="roadmap__lane-meta" onClick={onOpen}>
        <strong>{entry.epic.title}</strong>
        <span>
          {progressLabel}
          {entry.epic.assignee ? ` · ${entry.epic.assignee.name}` : ''}
        </span>
      </button>
      <div className="roadmap__track">
        {todayPct != null ? (
          <span className="roadmap__today" style={{ left: `${todayPct}%` }} aria-hidden />
        ) : null}
        {entry.placement ? (
          <button
            type="button"
            className={`roadmap__bar${priority ? ` roadmap__bar--priority-${priority}` : ''}`}
            style={{
              left: `${entry.placement.leftPct}%`,
              width: `${entry.placement.widthPct}%`,
            }}
            onClick={onOpen}
            title={entry.epic.title}
          >
            <span className="roadmap__bar-fill" style={{ width: `${progressPct}%` }} aria-hidden />
            <span className="roadmap__bar-label">{entry.epic.title}</span>
          </button>
        ) : (
          <span className="roadmap__out-of-range">Вне периода</span>
        )}
      </div>
    </>
  );
}
