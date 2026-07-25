'use client';

import { useState } from 'react';
import type { FunnelDeal } from '@/features/crm/types';
import { useApplyDealTemplateMutation, useDealTemplatesQuery } from '../hooks';

export function ApplyDealTemplateControl({
  workspaceId,
  funnelId,
  dealId,
  onApplied,
}: {
  workspaceId: string;
  funnelId: string;
  dealId: string;
  onApplied?: (deal: FunnelDeal) => void;
}) {
  const { data: templates = [] } = useDealTemplatesQuery(workspaceId);
  const applyMutation = useApplyDealTemplateMutation(workspaceId, funnelId, dealId);
  const [templateId, setTemplateId] = useState('');

  if (templates.length === 0) return null;

  return (
    <div className="task-drawer__field">
      <span>Шаблон</span>
      <div className="task-checklist__apply" role="group" aria-label="Применить шаблон сделки">
        <select
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          aria-label="Шаблон сделки"
        >
          <option value="">Применить шаблон…</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!templateId || applyMutation.isPending}
          onClick={() => {
            if (!templateId) return;
            applyMutation.mutate(templateId, {
              onSuccess: (deal) => {
                setTemplateId('');
                if (deal) onApplied?.(deal as FunnelDeal);
              },
            });
          }}
        >
          {applyMutation.isPending ? '…' : 'Применить'}
        </button>
      </div>
    </div>
  );
}
