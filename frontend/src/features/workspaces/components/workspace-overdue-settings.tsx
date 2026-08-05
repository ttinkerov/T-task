'use client';

import { useCallback, useMemo } from 'react';
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
  const { data: workspace, isLoading } = useWorkspaceQuery(workspaceId);
  const updateMutation = useUpdateWorkspaceMutation(workspaceId);

  const onToggle = useCallback(async () => {
    if (!workspace) return;
    await updateMutation.mutateAsync({
      autoRollOverdue: !workspace.autoRollOverdue,
    });
  }, [workspace, updateMutation]);

  const settingsProps = useMemo(
    () => ({
      isLoading: isLoading || !workspace,
      autoRollOverdue: Boolean(workspace?.autoRollOverdue),
      canManage,
      isPending: updateMutation.isPending,
      onToggle,
    }),
    [isLoading, workspace, canManage, updateMutation.isPending, onToggle],
  );

  return <VueIsland component={WorkspaceOverdueSettingsView} componentProps={settingsProps} />;
}
