'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import AiSummaryPanelView from '@/vue/ai/AiSummaryPanel.vue';
import { useAiSettingsQuery, useAiSummaryMutation } from '../hooks';
import type { AiSummaryPayload, AiSummaryScope } from '../types';

export function AiSummaryPanel({
  workspaceId,
  scope,
  sprintId,
  compact = false,
}: {
  workspaceId: string;
  scope: AiSummaryScope;
  sprintId?: string;
  compact?: boolean;
}) {
  const { data: settings } = useAiSettingsQuery(workspaceId);
  const summaryMutation = useAiSummaryMutation(workspaceId);

  const onGenerate = useCallback(
    (payload: AiSummaryPayload) => summaryMutation.mutateAsync(payload),
    [summaryMutation],
  );

  const viewProps = useMemo(
    () => ({
      configured: Boolean(settings?.configured),
      scope,
      sprintId: sprintId ?? '',
      compact,
      isPending: summaryMutation.isPending,
      onGenerate,
    }),
    [settings?.configured, scope, sprintId, compact, summaryMutation.isPending, onGenerate],
  );

  if (!settings?.configured) {
    return null;
  }

  if (scope === 'sprint' && !sprintId) {
    return null;
  }

  return <VueIsland component={AiSummaryPanelView} componentProps={viewProps} />;
}
