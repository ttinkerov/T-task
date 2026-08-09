'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskDisplayViewVue from '@/vue/boards/TaskDisplayView.vue';
import { PRIORITY_LABELS, type BoardColumn, type BoardTask } from '../types';
import {
  addDays,
  buildMonthGrid,
  buildWeekDays,
  getTimelinePlacement,
  startOfWeek,
  toDateKey,
  type BoardViewMode,
  type CalendarRange,
} from '../lib/task-view-utils';

type DisplayTask = { task: BoardTask; columnName: string };

type CompactItem = {
  id: string;
  title: string;
  subtitle: string;
  priorityClass: string;
};

export function TaskDisplayView({
  mode,
  columns,
  anchor,
  calendarRange = 'WEEK',
  onOpenTask,
}: {
  mode: Exclude<BoardViewMode, 'BOARD'>;
  columns: BoardColumn[];
  anchor: Date;
  calendarRange?: CalendarRange;
  onOpenTask: (taskId: string) => void;
}) {
  const tasks = useMemo(
    () =>
      columns.flatMap((column) => column.tasks.map((task) => ({ task, columnName: column.name }))),
    [columns],
  );

  const viewProps = useMemo(() => {
    const undated = tasks.filter(({ task }) => !task.dueDate).map((item) => toCompactItem(item));

    if (mode === 'TABLE') {
      return {
        mode: 'TABLE',
        tableRows: tasks.map(({ task, columnName }) => ({
          id: task.id,
          title: task.title,
          columnName,
          assignee: task.assignee?.name ?? 'Не назначен',
          priority: task.priority ? PRIORITY_LABELS[task.priority] : '—',
          dueLabel: formatDueDate(task.dueDate),
        })),
        undated: [],
        weekDays: [],
        monthDays: [],
        timelineDays: [],
        timelineRows: [],
        onOpenTask,
      };
    }

    if (mode === 'CALENDAR' && calendarRange === 'MONTH') {
      const days = buildMonthGrid(anchor);
      return {
        mode: 'MONTH',
        tableRows: [],
        weekDays: [],
        monthDays: days.map((day) => {
          const dateTasks = tasks
            .filter(({ task }) => task.dueDate && toDateKey(task.dueDate) === toDateKey(day))
            .map((item) => toCompactItem(item));
          const className = [
            day.getMonth() !== anchor.getMonth() ? 'is-outside' : '',
            toDateKey(day) === toDateKey(new Date()) ? 'is-today' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return {
            key: toDateKey(day),
            dayNumber: day.getDate(),
            className,
            ariaLabel: day.toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
            tasks: dateTasks,
          };
        }),
        undated,
        timelineDays: [],
        timelineRows: [],
        onOpenTask,
      };
    }

    if (mode === 'CALENDAR') {
      const days = buildWeekDays(anchor);
      return {
        mode: 'WEEK',
        tableRows: [],
        monthDays: [],
        weekDays: days.map((day) => ({
          key: toDateKey(day),
          weekday: day.toLocaleDateString('ru-RU', { weekday: 'short' }),
          dayNumber: day.getDate(),
          isToday: toDateKey(day) === toDateKey(new Date()),
          ariaLabel: day.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          tasks: tasks
            .filter(({ task }) => task.dueDate && toDateKey(task.dueDate) === toDateKey(day))
            .map((item) => toCompactItem(item)),
        })),
        undated,
        timelineDays: [],
        timelineRows: [],
        onOpenTask,
      };
    }

    const rangeStart = startOfWeek(anchor);
    const days = Array.from({ length: 14 }, (_, index) => addDays(rangeStart, index));
    const datedTasks = tasks.filter(({ task }) =>
      getTimelinePlacement(task, rangeStart, days.length),
    );

    return {
      mode: 'TIMELINE',
      tableRows: [],
      weekDays: [],
      monthDays: [],
      undated,
      timelineDays: days.map((day) => ({
        key: toDateKey(day),
        weekday: day.toLocaleDateString('ru-RU', { weekday: 'short' }),
        dayNumber: day.getDate(),
        isToday: toDateKey(day) === toDateKey(new Date()),
      })),
      timelineRows: datedTasks.map((item) => {
        const placement = getTimelinePlacement(item.task, rangeStart, days.length)!;
        return {
          id: item.task.id,
          title: item.task.title,
          columnName: item.columnName,
          barClass: item.task.priority
            ? `task-gantt-view__bar--${item.task.priority.toLowerCase()}`
            : '',
          gridColumn: `${placement.startIndex + 1} / span ${placement.span}`,
          barTitle: `${item.task.title}: до ${formatDueDate(item.task.dueDate)}`,
        };
      }),
      onOpenTask,
    };
  }, [anchor, calendarRange, mode, onOpenTask, tasks]);

  return <VueIsland component={TaskDisplayViewVue} componentProps={viewProps} />;
}

function toCompactItem({ task, columnName }: DisplayTask): CompactItem {
  return {
    id: task.id,
    title: task.title,
    subtitle: task.assignee?.name ?? columnName,
    priorityClass: task.priority ? `compact-view-task--${task.priority.toLowerCase()}` : '',
  };
}

function formatDueDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Без срока';
}
