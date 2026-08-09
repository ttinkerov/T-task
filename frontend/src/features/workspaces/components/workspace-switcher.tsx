'use client';

import { useEffect, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useWorkspaceStore } from '@/stores/workspace.store';
import WorkspaceSwitcherView from '@/vue/workspaces/WorkspaceSwitcher.vue';
import { useWorkspacesQuery } from '../hooks';

export function WorkspaceSwitcher() {
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);

  useEffect(() => {
    if (!workspaces.length) {
      return;
    }

    const exists = workspaces.some((workspace) => workspace.id === currentWorkspaceId);

    if (!currentWorkspaceId || !exists) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [currentWorkspaceId, setCurrentWorkspaceId, workspaces]);

  const viewProps = useMemo(
    () => ({
      workspaces: workspaces.map((workspace) => ({ id: workspace.id, name: workspace.name })),
      currentWorkspaceId: currentWorkspaceId ?? '',
      onChange: setCurrentWorkspaceId,
    }),
    [workspaces, currentWorkspaceId, setCurrentWorkspaceId],
  );

  if (isLoading || !workspaces.length) {
    return null;
  }

  return <VueIsland component={WorkspaceSwitcherView} componentProps={viewProps} />;
}
