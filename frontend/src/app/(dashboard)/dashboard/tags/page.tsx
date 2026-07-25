'use client';

import { TagsPage } from '@/features/tags/components/tags-page';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function TagsRoute() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return workspaceId ? (
    <TagsPage key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
