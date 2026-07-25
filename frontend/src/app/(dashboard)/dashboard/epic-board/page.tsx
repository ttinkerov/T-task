'use client';

import { EpicBoardPage } from '@/features/epic-board';
import { useWorkspaceStore } from '@/stores/workspace.store';
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
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return workspaceId ? (
    <EpicBoardPage
      key={workspaceId}
      workspaceId={workspaceId}
      initialEpicId={searchParams.get('epic')}
      initialTaskId={searchParams.get('task')}
    />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}

function EpicBoardFallback() {
  return <p className="text-sm text-muted-foreground">Загрузка эпик-борда...</p>;
}
