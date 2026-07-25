'use client';

import { useCallback, useState } from 'react';
import {
  readStoredViewPrefs,
  storeCalendarRange,
  storeViewMode,
} from '../../../lib/board-view-storage';
import type { BoardViewMode, CalendarRange } from '../../../lib/task-view-utils';

export function useBoardViewPrefs() {
  const [viewMode, setViewModeState] = useState<BoardViewMode>('BOARD');
  const [calendarRange, setCalendarRangeState] = useState<CalendarRange>('WEEK');
  const [viewAnchor, setViewAnchor] = useState(() => new Date());

  const hydrateFromStorage = useCallback((workspaceId: string) => {
    const stored = readStoredViewPrefs(workspaceId);
    setViewModeState(stored.mode);
    setCalendarRangeState(stored.calendarRange);
    setViewAnchor(new Date());
  }, []);

  const setViewMode = useCallback((workspaceId: string, mode: BoardViewMode) => {
    setViewModeState(mode);
    storeViewMode(workspaceId, mode);
  }, []);

  const setCalendarRange = useCallback((workspaceId: string, range: CalendarRange) => {
    setCalendarRangeState(range);
    storeCalendarRange(workspaceId, range);
  }, []);

  return {
    viewMode,
    calendarRange,
    viewAnchor,
    setViewMode,
    setCalendarRange,
    setViewAnchor,
    hydrateFromStorage,
  };
}
