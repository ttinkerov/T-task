'use client';

import { useMemo } from 'react';
import { useDealTasksQuery } from '../hooks';
import { computeDealLinkRollup, formatRollupDue } from '@/features/boards/lib/task-rollup';

export function DealRollupSection({
  workspaceId,
  dealId,
}: {
  workspaceId: string;
  dealId: string;
}) {
  const tasksQuery = useDealTasksQuery(workspaceId, dealId);
  const tasks = tasksQuery.data ?? [];

  const rollup = useMemo(() => computeDealLinkRollup(tasks.map((link) => link.task)), [tasks]);

  if (tasksQuery.isLoading) {
    return (
      <section className="task-rollup" aria-labelledby="deal-rollup-title">
        <h3 id="deal-rollup-title">Сводка по задачам</h3>
        <p className="task-rollup__empty" role="status">
          Считаем…
        </p>
      </section>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="task-rollup" aria-labelledby="deal-rollup-title">
      <h3 id="deal-rollup-title">Сводка по задачам</h3>
      <dl className="task-rollup__grid">
        <div>
          <dt>% done</dt>
          <dd>
            {rollup.donePercent === null
              ? '—'
              : `${rollup.donePercent}% · ${rollup.completedTaskCount}/${rollup.linkedTaskCount}`}
          </dd>
        </div>
        <div>
          <dt>Ближайший due</dt>
          <dd>{formatRollupDue(rollup.nearestDue)}</dd>
        </div>
      </dl>
    </section>
  );
}
