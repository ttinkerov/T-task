'use client';

import dynamic from 'next/dynamic';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspaceRouteGate } from '@/features/workspaces/use-workspace-route-gate';

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
  const { workspaceId, isReady, isLoading, isError, onRetry } = useWorkspaceRouteGate();

  return isReady && workspaceId ? (
    <WorkspaceWhiteboard key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />
  );
}
