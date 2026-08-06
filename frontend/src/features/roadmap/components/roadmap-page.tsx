'use client';

import { useAllTasksQuery, EMPTY_ALL_TASKS_FILTERS, type AllTask } from '@/features/all-tasks';
import { useSprintsQuery } from '@/features/sprints';
import { VueIsland } from '@/components/vue/VueIsland';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RoadmapPageView from '@/vue/roadmap/RoadmapPageView.vue';
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

const ROADMAP_TASKS_QUERY = {
  ...EMPTY_ALL_TASKS_FILTERS,
  page: 1,
  limit: 100,
  sortBy: 'DUE_DATE',
  sortOrder: 'ASC',
} as const;

type RoadmapLaneView = {
  id: string;
  title: string;
  progressLabel: string;
  progressPct: number;
  assigneeName: string | null;
  priority: string | null;
  placement: { leftPct: number; widthPct: number } | null;
};

type RoadmapUndatedView = {
  id: string;
  title: string;
  progressLabel: string;
};

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

  const lanes = useMemo<RoadmapLaneView[]>(
    () =>
      datedEpics.map((entry) => {
        const progressLabel =
          entry.progress.total > 0 ? `${entry.progress.done}/${entry.progress.total}` : '0/0';
        const progressPct =
          entry.progress.total > 0
            ? Math.round((entry.progress.done / entry.progress.total) * 100)
            : 0;

        return {
          id: entry.epic.id,
          title: entry.epic.title,
          progressLabel,
          progressPct,
          assigneeName: entry.epic.assignee?.name ?? null,
          priority: entry.epic.priority ?? null,
          placement: entry.placement
            ? { leftPct: entry.placement.leftPct, widthPct: entry.placement.widthPct }
            : null,
        };
      }),
    [datedEpics],
  );

  const undated = useMemo<RoadmapUndatedView[]>(
    () =>
      undatedEpics.map((entry) => ({
        id: entry.epic.id,
        title: entry.epic.title,
        progressLabel:
          entry.progress.total > 0
            ? `${entry.progress.done}/${entry.progress.total}`
            : 'Нет дочерних',
      })),
    [undatedEpics],
  );

  const truncationNote = isTruncated
    ? `Показаны первые ${data!.limit} задач из ${data!.total} — часть эпиков может не попасть в ленту.`
    : '';

  const onOpenTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const onMonthCountChange = useCallback((value: number) => {
    if (value === 3 || value === 6) setMonthCount(value);
  }, []);

  const onPrevPeriod = useCallback(() => {
    setRangeStart((current) => addMonths(current, -monthCount));
  }, [monthCount]);

  const onNextPeriod = useCallback(() => {
    setRangeStart((current) => addMonths(current, monthCount));
  }, [monthCount]);

  const onGoToday = useCallback(() => {
    setRangeStart(startOfMonth(new Date()));
  }, []);

  const viewProps = useMemo(
    () => ({
      monthCount,
      rangeLabel,
      months: months.map((month) => ({ key: month.key, label: month.label })),
      todayPct,
      lanes,
      undated,
      epicCount: datedEpics.length + undatedEpics.length,
      isLoading,
      isError,
      truncationNote,
      onMonthCountChange,
      onPrevPeriod,
      onNextPeriod,
      onGoToday,
      onOpenTask,
    }),
    [
      monthCount,
      rangeLabel,
      months,
      todayPct,
      lanes,
      undated,
      datedEpics.length,
      undatedEpics.length,
      isLoading,
      isError,
      truncationNote,
      onMonthCountChange,
      onPrevPeriod,
      onNextPeriod,
      onGoToday,
      onOpenTask,
    ],
  );

  return (
    <section className="roadmap">
      <VueIsland component={RoadmapPageView} componentProps={viewProps} />

      {selectedTask ? (
        <TaskDetailDrawer
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={`${selectedTask.board.name} · ${selectedTask.column.name}`}
          relationCandidates={relationCandidates}
          linkSource="all-tasks"
          onOpenTask={setSelectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </section>
  );
}
