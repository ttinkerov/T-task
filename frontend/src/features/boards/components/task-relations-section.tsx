'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import {
  useCreateTaskRelationMutation,
  useDeleteTaskRelationMutation,
  useTaskRelationsQuery,
} from '../hooks';
import type { TaskRelation, TaskRelationCandidate, TaskRelationType } from '../types';
import TaskRelationsSectionView from '@/vue/boards/TaskRelationsSection.vue';

const EMPTY_RELATIONS: TaskRelation[] = [];

interface TaskRelationsSectionProps {
  workspaceId: string;
  taskId: string;
  candidates: TaskRelationCandidate[];
  onOpenTask: (taskId: string) => void;
}

export function TaskRelationsSection({
  workspaceId,
  taskId,
  candidates,
  onOpenTask,
}: TaskRelationsSectionProps) {
  const relationsQuery = useTaskRelationsQuery(workspaceId, taskId);
  const createMutation = useCreateTaskRelationMutation(workspaceId, taskId);
  const deleteMutation = useDeleteTaskRelationMutation(workspaceId, taskId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const relations = relationsQuery.data ?? EMPTY_RELATIONS;

  const availableCandidates = useMemo(() => {
    const relatedIds = new Set(relations.map((relation) => relation.task.id));
    return candidates.filter(
      (candidate) => candidate.id !== taskId && !relatedIds.has(candidate.id),
    );
  }, [candidates, relations, taskId]);

  const onCreate = useCallback(
    (type: TaskRelationType, relatedTaskId: string) =>
      createMutation.mutateAsync({ type, relatedTaskId }),
    [createMutation],
  );

  const onDelete = useCallback(
    async (relationId: string, relatedTaskIdToDelete: string) => {
      setDeletingId(relationId);
      try {
        await deleteMutation.mutateAsync({
          relationId,
          relatedTaskId: relatedTaskIdToDelete,
        });
      } catch {
        /* ignore */
      } finally {
        setDeletingId(null);
      }
    },
    [deleteMutation],
  );

  const viewProps = useMemo(
    () => ({
      relations,
      availableCandidates,
      isLoading: relationsQuery.isLoading,
      loadError: Boolean(relationsQuery.error),
      createPending: createMutation.isPending,
      deletingId,
      actionError:
        createMutation.error?.message ??
        deleteMutation.error?.message ??
        (createMutation.error || deleteMutation.error ? 'Не удалось изменить связь.' : ''),
      onOpenTask,
      onDelete,
      onCreate,
    }),
    [
      relations,
      availableCandidates,
      relationsQuery.isLoading,
      relationsQuery.error,
      createMutation.isPending,
      createMutation.error,
      deleteMutation.error,
      deletingId,
      onOpenTask,
      onDelete,
      onCreate,
    ],
  );

  return <VueIsland component={TaskRelationsSectionView} componentProps={viewProps} />;
}
