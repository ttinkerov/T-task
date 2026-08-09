'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useTaskDealsQuery } from '@/features/crm/hooks';
import type { TaskDealLink } from '@/features/crm/deal-task-types';
import TaskRollupSectionView from '@/vue/boards/TaskRollupSection.vue';
import { useTaskRelationsQuery } from '../hooks';
import type { TaskRelation } from '../types';
import { computeTaskLinkRollup, formatRollupAmount, formatRollupDue } from '../lib/task-rollup';

const EMPTY_RELATIONS: TaskRelation[] = [];
const EMPTY_DEALS: TaskDealLink[] = [];

export function TaskRollupSection({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const relationsQuery = useTaskRelationsQuery(workspaceId, taskId);
  const dealsQuery = useTaskDealsQuery(workspaceId, taskId);

  const relations = relationsQuery.data ?? EMPTY_RELATIONS;
  const deals = dealsQuery.data ?? EMPTY_DEALS;

  const rollup = useMemo(
    () =>
      computeTaskLinkRollup(
        relations.map((relation) => relation.task),
        deals.map((link) => link.deal),
      ),
    [relations, deals],
  );

  const isLoading = relationsQuery.isLoading || dealsQuery.isLoading;
  const loadError =
    relationsQuery.isError || dealsQuery.isError
      ? relationsQuery.error instanceof Error
        ? relationsQuery.error.message
        : dealsQuery.error instanceof Error
          ? dealsQuery.error.message
          : 'Не удалось загрузить сводку'
      : '';
  const isEmpty = rollup.relatedTaskCount === 0 && rollup.dealCount === 0;

  const onRetryRollup = useCallback(() => {
    void relationsQuery.refetch();
    void dealsQuery.refetch();
  }, [relationsQuery, dealsQuery]);

  const viewProps = useMemo(
    () => ({
      isLoading,
      isEmpty,
      loadError,
      hint: isLoading
        ? 'Сводка по связанным задачам и сделкам: прогресс, сумма и ближайший срок.'
        : 'Сводка по связанным задачам и сделкам: процент готовности, сумма и ближайший срок.',
      doneLabel:
        rollup.donePercent === null
          ? '—'
          : `${rollup.donePercent}% · ${rollup.completedTaskCount}/${rollup.relatedTaskCount}`,
      amountLabel:
        rollup.dealCount === 0
          ? '—'
          : `${formatRollupAmount(rollup.amountSum)}${
              rollup.dealCount > 1 ? ` · ${rollup.dealCount}` : ''
            }`,
      dueLabel: formatRollupDue(rollup.nearestDue),
      onRetry: onRetryRollup,
    }),
    [isLoading, isEmpty, loadError, rollup, onRetryRollup],
  );

  if (!isLoading && !loadError && isEmpty) {
    return null;
  }

  return <VueIsland component={TaskRollupSectionView} componentProps={viewProps} />;
}
