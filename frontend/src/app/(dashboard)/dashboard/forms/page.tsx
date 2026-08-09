'use client';

import { FormsListPage } from '@/features/forms/components/forms-list-page';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FormsPage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && !isError && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, isError, router, workspaces.length]);

  return workspaceId ? (
    <FormsListPage workspaceId={workspaceId} />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
  );
}
