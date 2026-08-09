'use client';

import { AllTasksPage } from '@/features/all-tasks/components/all-tasks-page';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspaceRouteGate } from '@/features/workspaces/use-workspace-route-gate';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AllTasksRoute() {
  return (
    <Suspense fallback={<AllTasksRouteFallback />}>
      <AllTasksRouteContent />
    </Suspense>
  );
}

function AllTasksRouteContent() {
  const searchParams = useSearchParams();
  const { workspaceId, isReady, isLoading, isError, onRetry } = useWorkspaceRouteGate();

  return isReady && workspaceId ? (
    <AllTasksPage
      key={workspaceId}
      workspaceId={workspaceId}
      initialTaskId={searchParams.get('task')}
    />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />
  );
}

function AllTasksRouteFallback() {
  return <p className="text-sm text-muted-foreground">Загрузка задач...</p>;
}
