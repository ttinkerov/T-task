'use client';

import { FormsListPage } from '@/features/forms';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FormsPage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, workspaces.length]);

  return workspaceId ? (
    <FormsListPage workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
