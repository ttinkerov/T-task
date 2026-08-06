'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { computeDealLinkRollup, formatRollupDue } from '@/features/boards/lib/task-rollup';
import DealRollupSectionView from '@/vue/crm/DealRollupSection.vue';
import type { DealTaskLink } from '../deal-task-types';
import { useDealTasksQuery } from '../hooks';

const EMPTY_DEAL_TASKS: DealTaskLink[] = [];

export function DealRollupSection({
  workspaceId,
  dealId,
}: {
  workspaceId: string;
  dealId: string;
}) {
  const tasksQuery = useDealTasksQuery(workspaceId, dealId);
  const tasks = tasksQuery.data ?? EMPTY_DEAL_TASKS;

  const rollup = useMemo(() => computeDealLinkRollup(tasks.map((link) => link.task)), [tasks]);

  const isLoading = tasksQuery.isLoading;
  const isEmpty = tasks.length === 0;

  const viewProps = useMemo(
    () => ({
      isLoading,
      isEmpty,
      doneLabel:
        rollup.donePercent === null
          ? '—'
          : `${rollup.donePercent}% · ${rollup.completedTaskCount}/${rollup.linkedTaskCount}`,
      dueLabel: formatRollupDue(rollup.nearestDue),
    }),
    [isLoading, isEmpty, rollup],
  );

  if (!isLoading && isEmpty) {
    return null;
  }

  return <VueIsland component={DealRollupSectionView} componentProps={viewProps} />;
}
