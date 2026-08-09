'use client';

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VueIsland } from '@/components/vue/VueIsland';
import { EpicAiBreakdown } from '@/features/ai/components/epic-ai-breakdown';
import { useSprintsQuery } from '@/features/sprints';
import TaskPlanningFieldsView from '@/vue/boards/TaskPlanningFields.vue';
import { boardKeys, invalidateWorkspaceBoards } from '../../hooks';
import type { BoardTask, BoardView, TaskRelationCandidate } from '../../types';

export function TaskPlanningFields({
  workspaceId,
  task,
  relationCandidates,
  sprintId,
  epicId,
  isEpic,
  onSprintChange,
  onEpicChange,
  onIsEpicChange,
}: {
  workspaceId: string;
  task: BoardTask;
  relationCandidates: TaskRelationCandidate[];
  sprintId: string;
  epicId: string;
  isEpic: boolean;
  onSprintChange: (id: string) => void;
  onEpicChange: (id: string) => void;
  onIsEpicChange: (value: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const sprintsQuery = useSprintsQuery(workspaceId);
  const sprints = sprintsQuery.data ?? [];
  const cachedBoard = queryClient.getQueryData<BoardView>(boardKeys.detail(workspaceId, 'default'));
  const epicOptions = useMemo(() => {
    const fromCandidates = relationCandidates.filter(
      (candidate) => candidate.isEpic && candidate.id !== task.id,
    );
    if (fromCandidates.length > 0) {
      return fromCandidates.map((candidate) => ({ id: candidate.id, title: candidate.title }));
    }
    return (cachedBoard?.columns.flatMap((column) => column.tasks) ?? [])
      .filter((item) => item.isEpic && item.id !== task.id)
      .map((item) => ({ id: item.id, title: item.title }));
  }, [cachedBoard, relationCandidates, task.id]);

  const sprintOptions = useMemo(
    () => sprints.filter((sprint) => !sprint.closedAt || sprint.id === sprintId),
    [sprints, sprintId],
  );

  const sprintsLoadError = sprintsQuery.isError
    ? sprintsQuery.error instanceof Error
      ? sprintsQuery.error.message
      : 'Не удалось загрузить спринты'
    : '';

  const onRetrySprints = useCallback(() => {
    void sprintsQuery.refetch();
  }, [sprintsQuery]);

  const viewProps = useMemo(
    () => ({
      sprintId,
      epicId,
      isEpic,
      sprints: sprintOptions,
      epicOptions,
      sprintsLoadError,
      onSprintChange,
      onEpicChange,
      onIsEpicChange,
      onRetrySprints,
    }),
    [
      sprintId,
      epicId,
      isEpic,
      sprintOptions,
      epicOptions,
      sprintsLoadError,
      onSprintChange,
      onEpicChange,
      onIsEpicChange,
      onRetrySprints,
    ],
  );

  const onEpicApplied = useCallback(() => {
    invalidateWorkspaceBoards(queryClient, workspaceId);
    void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
  }, [queryClient, workspaceId]);

  return (
    <>
      <VueIsland component={TaskPlanningFieldsView} componentProps={viewProps} />
      {task.isEpic ? (
        <EpicAiBreakdown workspaceId={workspaceId} epicId={task.id} onApplied={onEpicApplied} />
      ) : null}
    </>
  );
}
