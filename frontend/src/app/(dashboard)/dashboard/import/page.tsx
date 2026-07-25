'use client';

import { ImportPage } from '@/features/import';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function ImportRoutePage() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return workspaceId ? (
    <ImportPage key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
