'use client';

import { RoadmapPage } from '@/features/roadmap/components/roadmap-page';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspaceRouteGate } from '@/features/workspaces/use-workspace-route-gate';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RoadmapRoute() {
  return (
    <Suspense fallback={<RoadmapRouteFallback />}>
      <RoadmapRouteContent />
    </Suspense>
  );
}

function RoadmapRouteContent() {
  const searchParams = useSearchParams();
  const { workspaceId, isReady, isLoading, isError, onRetry } = useWorkspaceRouteGate();

  return isReady && workspaceId ? (
    <RoadmapPage
      key={workspaceId}
      workspaceId={workspaceId}
      initialTaskId={searchParams.get('task')}
    />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />
  );
}

function RoadmapRouteFallback() {
  return <p className="text-sm text-muted-foreground">Загрузка роадмапа...</p>;
}
