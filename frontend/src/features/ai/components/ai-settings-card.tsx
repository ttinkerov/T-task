'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import AiSettingsCardView from '@/vue/ai/AiSettingsCard.vue';
import {
  useAiRagStatusQuery,
  useAiSettingsQuery,
  useDeleteAiSettingsMutation,
  useReindexAiRagMutation,
  useTestAiConnectionMutation,
  useUpsertAiSettingsMutation,
} from '../hooks';
import {
  AI_EMBEDDING_PROVIDER_OPTIONS,
  AI_PROVIDER_OPTIONS,
  type UpsertAiSettingsPayload,
} from '../types';

export function AiSettingsCard({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const { data: settings, isLoading, isError, error, refetch } = useAiSettingsQuery(workspaceId);
  const { data: ragStatus, isLoading: ragLoading } = useAiRagStatusQuery(workspaceId);
  const upsertMutation = useUpsertAiSettingsMutation(workspaceId);
  const deleteMutation = useDeleteAiSettingsMutation(workspaceId);
  const testMutation = useTestAiConnectionMutation(workspaceId);
  const reindexMutation = useReindexAiRagMutation(workspaceId);

  const onSave = useCallback(
    (payload: UpsertAiSettingsPayload) => upsertMutation.mutateAsync(payload),
    [upsertMutation],
  );

  const onTest = useCallback(() => testMutation.mutateAsync(), [testMutation]);

  const onDelete = useCallback(() => deleteMutation.mutateAsync(), [deleteMutation]);

  const onReindex = useCallback(() => reindexMutation.mutateAsync(), [reindexMutation]);

  const viewProps = useMemo(
    () => ({
      settings: settings ?? null,
      isLoading,
      isError,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить настройки ИИ'
        : '',
      onRetryLoad: () => {
        void refetch();
      },
      canManage,
      providerOptions: AI_PROVIDER_OPTIONS,
      embeddingProviderOptions: AI_EMBEDDING_PROVIDER_OPTIONS,
      upsertPending: upsertMutation.isPending,
      testPending: testMutation.isPending,
      deletePending: deleteMutation.isPending,
      ragStatus: ragStatus ?? null,
      ragLoading,
      reindexPending: reindexMutation.isPending,
      onSave,
      onTest,
      onDelete,
      onReindex,
    }),
    [
      settings,
      isLoading,
      isError,
      error,
      refetch,
      canManage,
      upsertMutation.isPending,
      testMutation.isPending,
      deleteMutation.isPending,
      ragStatus,
      ragLoading,
      reindexMutation.isPending,
      onSave,
      onTest,
      onDelete,
      onReindex,
    ],
  );

  return <VueIsland component={AiSettingsCardView} componentProps={viewProps} />;
}
