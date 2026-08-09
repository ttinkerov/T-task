'use client';

import { TemplatesPage } from '@/features/templates/components/templates-page';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspaceRouteGate } from '@/features/workspaces/use-workspace-route-gate';

export default function TemplatesRoutePage() {
  const { workspaceId, isReady, isLoading, isError, onRetry } = useWorkspaceRouteGate();

  return isReady && workspaceId ? (
    <TemplatesPage key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />
  );
}
