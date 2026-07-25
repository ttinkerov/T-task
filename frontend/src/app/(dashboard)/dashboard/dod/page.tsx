'use client';

import { DodTemplatesPage } from '@/features/dod';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function DodRoutePage() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return workspaceId ? (
    <DodTemplatesPage key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
