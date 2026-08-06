'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import EpicAiBreakdownView from '@/vue/ai/EpicAiBreakdown.vue';
import {
  useAiSettingsQuery,
  useApplyEpicBreakdownMutation,
  useProposeEpicBreakdownMutation,
} from '../hooks';
import type { EpicBreakdownDraft } from '../types';

export function EpicAiBreakdown({
  workspaceId,
  epicId,
  onApplied,
}: {
  workspaceId: string;
  epicId: string;
  onApplied?: () => void;
}) {
  const { data: settings } = useAiSettingsQuery(workspaceId);
  const proposeMutation = useProposeEpicBreakdownMutation(workspaceId, epicId);
  const applyMutation = useApplyEpicBreakdownMutation(workspaceId, epicId);

  const onPropose = useCallback(
    async (instructions?: string) => {
      const result = await proposeMutation.mutateAsync({
        instructions,
      });
      return result;
    },
    [proposeMutation],
  );

  const onApply = useCallback(
    async (tasks: EpicBreakdownDraft[]) => {
      const result = await applyMutation.mutateAsync({ tasks });
      onApplied?.();
      return result;
    },
    [applyMutation, onApplied],
  );

  const viewProps = useMemo(
    () => ({
      configured: Boolean(settings?.configured),
      proposePending: proposeMutation.isPending,
      applyPending: applyMutation.isPending,
      onPropose,
      onApply,
    }),
    [settings?.configured, proposeMutation.isPending, applyMutation.isPending, onPropose, onApply],
  );

  if (!settings?.configured) {
    return null;
  }

  return <VueIsland component={EpicAiBreakdownView} componentProps={viewProps} />;
}
