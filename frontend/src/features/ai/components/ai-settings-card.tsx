'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import AiSettingsCardView from '@/vue/ai/AiSettingsCard.vue';
import {
  useAiSettingsQuery,
  useDeleteAiSettingsMutation,
  useTestAiConnectionMutation,
  useUpsertAiSettingsMutation,
} from '../hooks';
import { AI_PROVIDER_OPTIONS, type UpsertAiSettingsPayload } from '../types';

export function AiSettingsCard({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const { data: settings, isLoading } = useAiSettingsQuery(workspaceId);
  const upsertMutation = useUpsertAiSettingsMutation(workspaceId);
  const deleteMutation = useDeleteAiSettingsMutation(workspaceId);
  const testMutation = useTestAiConnectionMutation(workspaceId);

  const onSave = useCallback(
    (payload: UpsertAiSettingsPayload) => upsertMutation.mutateAsync(payload),
    [upsertMutation],
  );

  const onTest = useCallback(() => testMutation.mutateAsync(), [testMutation]);

  const onDelete = useCallback(() => deleteMutation.mutateAsync(), [deleteMutation]);

  const viewProps = useMemo(
    () => ({
      settings: settings ?? null,
      isLoading,
      canManage,
      providerOptions: AI_PROVIDER_OPTIONS,
      upsertPending: upsertMutation.isPending,
      testPending: testMutation.isPending,
      deletePending: deleteMutation.isPending,
      onSave,
      onTest,
      onDelete,
    }),
    [
      settings,
      isLoading,
      canManage,
      upsertMutation.isPending,
      testMutation.isPending,
      deleteMutation.isPending,
      onSave,
      onTest,
      onDelete,
    ],
  );

  return <VueIsland component={AiSettingsCardView} componentProps={viewProps} />;
}
