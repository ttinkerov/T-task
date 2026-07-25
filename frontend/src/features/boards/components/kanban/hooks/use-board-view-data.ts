'use client';

import { useMemo } from 'react';
import { useCustomFieldsQuery } from '@/features/custom-fields/hooks';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { matchesFilters } from '../../../lib/board-task-filters';
import { isDoneColumn } from '../../../lib/overdue';
import type { BoardFilters, BoardView } from '../../../types';

export function useBoardViewData(
  workspaceId: string,
  board: BoardView | null | undefined,
  filters: BoardFilters,
  currentUserId?: string,
) {
  const { data: customFields = [] } = useCustomFieldsQuery(workspaceId);
  const { data: members = [] } = useMembersQuery(workspaceId);

  const filteredColumns = useMemo(() => {
    if (!board) return [];
    return board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) =>
        matchesFilters(task, column, board.columns, filters, currentUserId),
      ),
    }));
  }, [board, filters, currentUserId]);

  const cardFields = useMemo(
    () => customFields.filter((field) => field.showOnCard),
    [customFields],
  );

  const memberNames = useMemo(
    () => new Map(members.map((member) => [member.userId, member.user.name])),
    [members],
  );

  const relationCandidates = useMemo(
    () =>
      board?.columns.flatMap((column) =>
        column.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          columnName: column.name,
          completed: Boolean(task.completedAt) || isDoneColumn(column, board.columns),
          isEpic: Boolean(task.isEpic),
        })),
      ) ?? [],
    [board],
  );

  const orderedTaskIds = useMemo(
    () => filteredColumns.flatMap((column) => column.tasks.map((task) => task.id)),
    [filteredColumns],
  );

  return {
    filteredColumns,
    cardFields,
    memberNames,
    relationCandidates,
    orderedTaskIds,
  };
}
