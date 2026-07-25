'use client';

import { TemplatesPage } from '@/features/templates';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function TemplatesRoutePage() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return workspaceId ? (
    <TemplatesPage key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
