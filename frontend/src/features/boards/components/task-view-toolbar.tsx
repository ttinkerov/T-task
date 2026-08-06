'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskViewToolbarView from '@/vue/boards/TaskViewToolbar.vue';
import {
  addDays,
  buildWeekDays,
  startOfWeek,
  type BoardViewMode,
  type CalendarRange,
} from '../lib/task-view-utils';

const VIEW_OPTIONS: { value: BoardViewMode; label: string }[] = [
  { value: 'BOARD', label: 'Доска' },
  { value: 'TABLE', label: 'Таблица' },
  { value: 'CALENDAR', label: 'Календарь' },
  { value: 'TIMELINE', label: 'Таймлайн' },
];

const CALENDAR_RANGE_OPTIONS: { value: CalendarRange; label: string }[] = [
  { value: 'WEEK', label: 'Неделя' },
  { value: 'MONTH', label: 'Месяц' },
];

interface ViewToolbarProps {
  mode: BoardViewMode;
  anchor: Date;
  calendarRange?: CalendarRange;
  modes?: BoardViewMode[];
  onModeChange: (mode: BoardViewMode) => void;
  onAnchorChange: (date: Date) => void;
  onCalendarRangeChange?: (range: CalendarRange) => void;
}

export function TaskViewToolbar({
  mode,
  anchor,
  calendarRange = 'WEEK',
  modes,
  onModeChange,
  onAnchorChange,
  onCalendarRangeChange,
}: ViewToolbarProps) {
  const hasDateNavigation = mode === 'CALENDAR' || mode === 'TIMELINE';
  const step = mode === 'CALENDAR' && calendarRange === 'MONTH' ? 1 : mode === 'CALENDAR' ? 7 : 14;

  const periodLabel = useMemo(() => {
    if (mode === 'CALENDAR' && calendarRange === 'MONTH') {
      return anchor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    }
    if (mode === 'CALENDAR') {
      return formatRange(buildWeekDays(anchor));
    }
    if (mode === 'TIMELINE') {
      return formatRange(
        Array.from({ length: 14 }, (_, index) => addDays(startOfWeek(anchor), index)),
      );
    }
    return '';
  }, [anchor, calendarRange, mode]);

  const viewOptions = useMemo(
    () => VIEW_OPTIONS.filter((option) => !modes || modes.includes(option.value)),
    [modes],
  );

  const onPrev = useCallback(() => {
    onAnchorChange(
      mode === 'CALENDAR' && calendarRange === 'MONTH'
        ? new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
        : addDays(anchor, -step),
    );
  }, [anchor, calendarRange, mode, onAnchorChange, step]);

  const onNext = useCallback(() => {
    onAnchorChange(
      mode === 'CALENDAR' && calendarRange === 'MONTH'
        ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
        : addDays(anchor, step),
    );
  }, [anchor, calendarRange, mode, onAnchorChange, step]);

  const onToday = useCallback(() => {
    onAnchorChange(new Date());
  }, [onAnchorChange]);

  const viewProps = useMemo(
    () => ({
      mode,
      viewOptions,
      calendarRange,
      calendarRangeOptions: CALENDAR_RANGE_OPTIONS,
      showCalendarRange: mode === 'CALENDAR' && Boolean(onCalendarRangeChange),
      hasDateNavigation,
      periodLabel,
      onModeChange,
      onCalendarRangeChange: onCalendarRangeChange ?? null,
      onPrev,
      onNext,
      onToday,
    }),
    [
      mode,
      viewOptions,
      calendarRange,
      onCalendarRangeChange,
      hasDateNavigation,
      periodLabel,
      onModeChange,
      onPrev,
      onNext,
      onToday,
    ],
  );

  return <VueIsland component={TaskViewToolbarView} componentProps={viewProps} />;
}

function formatRange(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  return `${first.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })} — ${last.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}
