'use client';

import { useCallback, useMemo } from 'react';
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
  const membersQuery = useMembersQuery(workspaceId);
  const tagsQuery = useTagsQuery(workspaceId);
  const sprintsQuery = useSprintsQuery(workspaceId);
  const { data: board } = useBoardQuery(workspaceId, boardId);
  const members = membersQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const sprints = sprintsQuery.data ?? [];

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

  const onReset = useCallback(() => {
    onChange(EMPTY_BOARD_FILTERS);
  }, [onChange]);

  const onRetry = useCallback(() => {
    void membersQuery.refetch();
    void tagsQuery.refetch();
    void sprintsQuery.refetch();
  }, [membersQuery, tagsQuery, sprintsQuery]);

  const loadError =
    membersQuery.isError || tagsQuery.isError || sprintsQuery.isError
      ? membersQuery.error instanceof Error
        ? membersQuery.error.message
        : tagsQuery.error instanceof Error
          ? tagsQuery.error.message
          : sprintsQuery.error instanceof Error
            ? sprintsQuery.error.message
            : 'Не удалось загрузить данные фильтров'
      : '';

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
      loadError,
      onChange,
      onReset,
      onRetry,
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
      loadError,
      onChange,
      onReset,
      onRetry,
    ],
  );

  return (
    <div className="board-filters">
      <SavedFiltersControl
        workspaceId={workspaceId}
        view="BOARD"
        filters={filters}
        onApply={onChange}
      />
      <VueIsland component={BoardFiltersBarView} componentProps={viewProps} displayContents />
    </div>
  );
}
