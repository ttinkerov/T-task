'use client';

import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export function useWorkspaceRouteGate(options?: { redirectOnEmpty?: boolean }) {
  const redirectOnEmpty = options?.redirectOnEmpty ?? true;
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspacesQuery();

  useEffect(() => {
    if (!redirectOnEmpty) return;
    if (!isLoading && !isError && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isError, isLoading, redirectOnEmpty, router, workspaces.length]);

  const onRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    workspaceId,
    workspaces,
    isLoading,
    isError,
    onRetry,
    isReady: Boolean(workspaceId),
  };
}
