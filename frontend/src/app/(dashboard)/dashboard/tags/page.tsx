'use client';

import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { TagsPage } from '@/features/tags/components/tags-page';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function TagsRoute() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return (
    <DashboardShell>
      {workspaceId ? (
        <TagsPage key={workspaceId} workspaceId={workspaceId} />
      ) : (
        <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
      )}
    </DashboardShell>
  );
}
