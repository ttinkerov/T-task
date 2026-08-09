'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppsPage } from '@/features/apps/components/apps-page';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function ExternalAppsRoutePage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && !isError && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, isError, router, workspaces.length]);

  return workspaceId ? (
    <AppsPage workspaceId={workspaceId} />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
  );
}
