'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import WorkspaceOverdueSettingsView from '@/vue/workspaces/WorkspaceOverdueSettings.vue';
import { useWorkspaceQuery, useUpdateWorkspaceMutation } from '../hooks';

export function WorkspaceOverdueSettings({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const { data: workspace, isLoading, isError, error, refetch } = useWorkspaceQuery(workspaceId);
  const updateMutation = useUpdateWorkspaceMutation(workspaceId);
  const [actionError, setActionError] = useState('');

  const onToggle = useCallback(async () => {
    if (!workspace) return;
    setActionError('');
    try {
      await updateMutation.mutateAsync({
        autoRollOverdue: !workspace.autoRollOverdue,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось сохранить настройку');
    }
  }, [workspace, updateMutation]);

  const settingsProps = useMemo(
    () => ({
      isLoading: isLoading || !workspace,
      isError,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить настройки'
        : '',
      actionError,
      autoRollOverdue: Boolean(workspace?.autoRollOverdue),
      canManage,
      isPending: updateMutation.isPending,
      onRetryLoad: () => {
        void refetch();
      },
      onToggle,
    }),
    [
      isLoading,
      workspace,
      isError,
      error,
      actionError,
      canManage,
      updateMutation.isPending,
      refetch,
      onToggle,
    ],
  );

  return <VueIsland component={WorkspaceOverdueSettingsView} componentProps={settingsProps} />;
}
