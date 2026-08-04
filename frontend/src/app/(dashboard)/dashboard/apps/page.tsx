'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppsPage } from '@/features/apps/components/apps-page';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function ExternalAppsRoutePage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, workspaces.length]);

  return workspaceId ? (
    <AppsPage workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
