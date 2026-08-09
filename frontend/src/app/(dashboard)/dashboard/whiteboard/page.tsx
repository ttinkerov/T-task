'use client';

import dynamic from 'next/dynamic';
import { useWorkspaceStore } from '@/stores/workspace.store';

const WorkspaceWhiteboard = dynamic(
  () =>
    import('@/features/whiteboard/components/workspace-whiteboard').then((mod) => ({
      default: mod.WorkspaceWhiteboard,
    })),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted-foreground">Загрузка доски…</p>,
  },
);

export default function WhiteboardRoute() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return workspaceId ? (
    <WorkspaceWhiteboard key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
