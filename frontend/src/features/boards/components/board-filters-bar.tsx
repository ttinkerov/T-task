'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import { SavedFiltersControl } from '@/features/saved-filters/components/saved-filters-control';
import { useSprintsQuery } from '@/features/sprints';
import { useTagsQuery } from '@/features/tags/hooks';
import { useMembersQuery } from '@/features/workspaces/hooks';
import BoardFiltersBarView from '@/vue/boards/BoardFiltersBar.vue';
import { useBoardQuery } from '../hooks';
import {
  EMPTY_BOARD_FILTERS,
  OVERDUE_FILTER_OPTIONS,
  PRIORITY_OPTIONS,
  type BoardFilters,
} from '../types';

interface BoardFiltersBarProps {
  workspaceId: string;
  boardId?: string | null;
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
}

export function BoardFiltersBar({
  workspaceId,
  boardId = null,
  filters,
  onChange,
}: BoardFiltersBarProps) {
  const { data: members = [] } = useMembersQuery(workspaceId);
  const { data: tags = [] } = useTagsQuery(workspaceId);
  const { data: sprints = [] } = useSprintsQuery(workspaceId);
  const { data: board } = useBoardQuery(workspaceId, boardId);
  const [savedFiltersHost, setSavedFiltersHost] = useState<HTMLElement | null>(null);

  const activeSprint = sprints.find((sprint) => sprint.active) ?? null;
  const epics = useMemo(() => {
    if (!board) return [];
    return board.columns.flatMap((column) => column.tasks).filter((task) => task.isEpic);
  }, [board]);

  const memberOptions = useMemo(
    () => members.map((member) => ({ userId: member.userId, name: member.user.name })),
    [members],
  );

  const priorityOptions = useMemo(() => PRIORITY_OPTIONS.filter((option) => option.value), []);

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.priority) ||
    Boolean(filters.assigneeId) ||
    Boolean(filters.tagId) ||
    filters.myTasksOnly ||
    Boolean(filters.overdueStatus) ||
    Boolean(filters.sprintId) ||
    Boolean(filters.epicId);

  const onSavedHost = useCallback((el: HTMLElement | null) => {
    setSavedFiltersHost(el);
  }, []);

  const onReset = useCallback(() => {
    onChange(EMPTY_BOARD_FILTERS);
  }, [onChange]);

  const viewProps = useMemo(
    () => ({
      filters,
      members: memberOptions,
      tags,
      sprints,
      epics,
      activeSprint,
      priorityOptions,
      overdueOptions: OVERDUE_FILTER_OPTIONS,
      hasActiveFilters,
      onChange,
      onReset,
      onSavedHost,
    }),
    [
      filters,
      memberOptions,
      tags,
      sprints,
      epics,
      activeSprint,
      priorityOptions,
      hasActiveFilters,
      onChange,
      onReset,
      onSavedHost,
    ],
  );

  return (
    <>
      <VueIsland component={BoardFiltersBarView} componentProps={viewProps} />
      {savedFiltersHost
        ? createPortal(
            <SavedFiltersControl
              workspaceId={workspaceId}
              view="BOARD"
              filters={filters}
              onApply={onChange}
            />,
            savedFiltersHost,
          )
        : null}
    </>
  );
}
