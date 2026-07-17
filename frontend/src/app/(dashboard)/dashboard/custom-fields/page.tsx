'use client';

import { CustomFieldsPage } from '@/features/custom-fields';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function CustomFieldsRoutePage() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return (
    <DashboardShell>
      {workspaceId ? (
        <CustomFieldsPage key={workspaceId} workspaceId={workspaceId} />
      ) : (
        <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
      )}
    </DashboardShell>
  );
}
