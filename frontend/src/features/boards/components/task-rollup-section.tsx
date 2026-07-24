'use client';

import { useMemo } from 'react';
import { useTaskDealsQuery } from '@/features/crm/hooks';
import { useTaskRelationsQuery } from '../hooks';
import { computeTaskLinkRollup, formatRollupAmount, formatRollupDue } from '../lib/task-rollup';
import { FieldHint } from './field-hint';

export function TaskRollupSection({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const relationsQuery = useTaskRelationsQuery(workspaceId, taskId);
  const dealsQuery = useTaskDealsQuery(workspaceId, taskId);

  const relations = relationsQuery.data ?? [];
  const deals = dealsQuery.data ?? [];

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

  if (isLoading) {
    return (
      <section className="task-rollup" aria-labelledby="task-rollup-title">
        <h3 id="task-rollup-title" className="task-drawer__section-title">
          Сводка
          <FieldHint text="Rollup по связанным задачам и сделкам: прогресс, сумма и ближайший срок." />
        </h3>
        <p className="task-rollup__empty" role="status">
          Считаем…
        </p>
      </section>
    );
  }

  if (isEmpty) {
    return null;
  }

  return (
    <section className="task-rollup" aria-labelledby="task-rollup-title">
      <h3 id="task-rollup-title" className="task-drawer__section-title">
        Сводка
        <FieldHint text="Rollup по связанным задачам и сделкам: % done, сумма amount, ближайший due." />
      </h3>
      <dl className="task-rollup__grid">
        <div>
          <dt>% done</dt>
          <dd>
            {rollup.donePercent === null
              ? '—'
              : `${rollup.donePercent}% · ${rollup.completedTaskCount}/${rollup.relatedTaskCount}`}
          </dd>
        </div>
        <div>
          <dt>Сумма сделок</dt>
          <dd>
            {rollup.dealCount === 0
              ? '—'
              : `${formatRollupAmount(rollup.amountSum)}${
                  rollup.dealCount > 1 ? ` · ${rollup.dealCount}` : ''
                }`}
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
