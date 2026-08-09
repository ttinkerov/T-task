'use client';

import { EpicBoardPage } from '@/features/epic-board/components/epic-board-page';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspaceRouteGate } from '@/features/workspaces/use-workspace-route-gate';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function EpicBoardRoute() {
  return (
    <Suspense fallback={<EpicBoardFallback />}>
      <EpicBoardRouteContent />
    </Suspense>
  );
}

function EpicBoardRouteContent() {
  const searchParams = useSearchParams();
  const { workspaceId, isReady, isLoading, isError, onRetry } = useWorkspaceRouteGate();

  return isReady && workspaceId ? (
    <EpicBoardPage
      key={workspaceId}
      workspaceId={workspaceId}
      initialEpicId={searchParams.get('epic')}
      initialTaskId={searchParams.get('task')}
    />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />
  );
}

function EpicBoardFallback() {
  return <p className="text-sm text-muted-foreground">Загрузка эпик-борда...</p>;
}
