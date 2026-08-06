'use client';

import { useMemo } from 'react';
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
  const isEmpty = rollup.relatedTaskCount === 0 && rollup.dealCount === 0;

  const viewProps = useMemo(
    () => ({
      isLoading,
      isEmpty,
      hint: isLoading
        ? 'Rollup по связанным задачам и сделкам: прогресс, сумма и ближайший срок.'
        : 'Rollup по связанным задачам и сделкам: % done, сумма amount, ближайший due.',
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
    }),
    [isLoading, isEmpty, rollup],
  );

  if (!isLoading && isEmpty) {
    return null;
  }

  return <VueIsland component={TaskRollupSectionView} componentProps={viewProps} />;
}
