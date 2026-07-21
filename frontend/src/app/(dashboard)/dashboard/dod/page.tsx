'use client';

import { DodTemplatesPage } from '@/features/dod';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function DodRoutePage() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return (
    <DashboardShell>
      {workspaceId ? (
        <DodTemplatesPage key={workspaceId} workspaceId={workspaceId} />
      ) : (
        <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
      )}
    </DashboardShell>
  );
}
