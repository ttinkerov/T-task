'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import type { FunnelDeal } from '@/features/crm/types';
import ApplyDealTemplateControlView from '@/vue/templates/ApplyDealTemplateControl.vue';
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
  const { data: templates = [], isError, error, refetch } = useDealTemplatesQuery(workspaceId);
  const applyMutation = useApplyDealTemplateMutation(workspaceId, funnelId, dealId);
  const [actionError, setActionError] = useState('');

  const onApply = useCallback(
    async (templateId: string) => {
      setActionError('');
      try {
        const deal = await applyMutation.mutateAsync(templateId);
        if (deal) onApplied?.(deal as FunnelDeal);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось применить шаблон');
        throw err;
      }
    },
    [applyMutation, onApplied],
  );

  const loadError = isError
    ? error instanceof Error
      ? error.message
      : 'Не удалось загрузить шаблоны'
    : '';

  const viewProps = useMemo(
    () => ({
      templates,
      isPending: applyMutation.isPending,
      actionError: actionError || loadError,
      onApply,
      onRetry: isError
        ? () => {
            void refetch();
          }
        : undefined,
    }),
    [templates, applyMutation.isPending, actionError, loadError, onApply, isError, refetch],
  );

  if (!isError && templates.length === 0) return null;

  return <VueIsland component={ApplyDealTemplateControlView} componentProps={viewProps} />;
}
