'use client';

import { useCallback, useMemo } from 'react';
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
  const { data: templates = [] } = useDealTemplatesQuery(workspaceId);
  const applyMutation = useApplyDealTemplateMutation(workspaceId, funnelId, dealId);

  const onApply = useCallback(
    async (templateId: string) => {
      const deal = await applyMutation.mutateAsync(templateId);
      if (deal) onApplied?.(deal as FunnelDeal);
    },
    [applyMutation, onApplied],
  );

  const viewProps = useMemo(
    () => ({
      templates,
      isPending: applyMutation.isPending,
      onApply,
    }),
    [templates, applyMutation.isPending, onApply],
  );

  if (templates.length === 0) return null;

  return <VueIsland component={ApplyDealTemplateControlView} componentProps={viewProps} />;
}
