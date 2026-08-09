'use client';

import { DodTemplatesPage } from '@/features/dod/components/dod-templates-page';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspaceRouteGate } from '@/features/workspaces/use-workspace-route-gate';

export default function DodRoutePage() {
  const { workspaceId, isReady, isLoading, isError, onRetry } = useWorkspaceRouteGate();

  return isReady && workspaceId ? (
    <DodTemplatesPage key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />
  );
}
