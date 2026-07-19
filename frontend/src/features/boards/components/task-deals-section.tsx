'use client';

import { useMemo, useState } from 'react';
import { formatDealAmount } from '@/features/crm/types';
import {
  useFunnelsQuery,
  useFunnelQuery,
  useLinkTaskDealMutation,
  useTaskDealsQuery,
  useUnlinkTaskDealMutation,
} from '@/features/crm/hooks';

export function TaskDealsSection({ workspaceId, taskId }: { workspaceId: string; taskId: string }) {
  const { data: links = [], isLoading } = useTaskDealsQuery(workspaceId, taskId);
  const { data: funnels = [] } = useFunnelsQuery(workspaceId);
  const [funnelId, setFunnelId] = useState('');
  const [dealId, setDealId] = useState('');
  const funnelQuery = useFunnelQuery(workspaceId, funnelId || null);
  const linkMutation = useLinkTaskDealMutation(workspaceId, taskId);
  const unlinkMutation = useUnlinkTaskDealMutation(workspaceId, taskId);

  const linkedIds = useMemo(() => new Set(links.map((link) => link.dealId)), [links]);

  const dealOptions = useMemo(() => {
    if (!funnelQuery.data) return [];
    return funnelQuery.data.stages.flatMap((stage) =>
      stage.deals
        .filter((deal) => !linkedIds.has(deal.id))
        .map((deal) => ({
          id: deal.id,
          label: `${deal.title} · ${stage.name}`,
        })),
    );
  }, [funnelQuery.data, linkedIds]);

  return (
    <section className="task-subtasks" aria-labelledby="task-deals-title">
      <div className="task-subtasks__header">
        <h3 id="task-deals-title">Сделки</h3>
        <span>{links.length}</span>
      </div>

      {isLoading ? <p role="status">Загрузка связей...</p> : null}

      {links.length === 0 && !isLoading ? (
        <p className="task-tags__empty">Нет связанных сделок</p>
      ) : (
        <ul className="task-subtasks__list" role="list">
          {links.map((link) => (
            <li key={link.dealId}>
              <span>
                {link.deal.title}
                <small className="task-deals__meta">
                  {' '}
                  · {link.deal.stageName}
                  {formatDealAmount(link.deal.amount)
                    ? ` · ${formatDealAmount(link.deal.amount)}`
                    : ''}
                </small>
              </span>
              <button
                type="button"
                aria-label={`Отвязать сделку ${link.deal.title}`}
                disabled={unlinkMutation.isPending}
                onClick={() => unlinkMutation.mutate(link.dealId)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="task-subtasks__create task-deals__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!dealId) return;
          linkMutation.mutate(dealId, {
            onSuccess: () => {
              setDealId('');
            },
          });
        }}
      >
        <select
          value={funnelId}
          onChange={(event) => {
            setFunnelId(event.target.value);
            setDealId('');
          }}
          aria-label="Воронка"
        >
          <option value="">Воронка</option>
          {funnels.map((funnel) => (
            <option key={funnel.id} value={funnel.id}>
              {funnel.name}
            </option>
          ))}
        </select>
        <select
          value={dealId}
          onChange={(event) => setDealId(event.target.value)}
          disabled={!funnelId}
          aria-label="Сделка"
        >
          <option value="">Сделка</option>
          {dealOptions.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!dealId || linkMutation.isPending}>
          Связать
        </button>
      </form>

      {linkMutation.error || unlinkMutation.error ? (
        <p className="text-sm text-red-400" role="alert">
          {(linkMutation.error ?? unlinkMutation.error)?.message}
        </p>
      ) : null}
    </section>
  );
}
