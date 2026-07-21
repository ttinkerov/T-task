'use client';

import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { ImportPage } from '@/features/import';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function ImportRoutePage() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return (
    <DashboardShell>
      {workspaceId ? (
        <ImportPage key={workspaceId} workspaceId={workspaceId} />
      ) : (
        <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
      )}
    </DashboardShell>
  );
}
