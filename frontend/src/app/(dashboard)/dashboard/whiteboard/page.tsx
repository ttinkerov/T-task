'use client';

import dynamic from 'next/dynamic';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { useWorkspaceStore } from '@/stores/workspace.store';

const WorkspaceWhiteboard = dynamic(
  () =>
    import('@/features/whiteboard').then((mod) => ({
      default: mod.WorkspaceWhiteboard,
    })),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted-foreground">Загрузка доски…</p>,
  },
);

export default function WhiteboardRoute() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return (
    <DashboardShell boardMode>
      {workspaceId ? (
        <WorkspaceWhiteboard key={workspaceId} workspaceId={workspaceId} />
      ) : (
        <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
      )}
    </DashboardShell>
  );
}
