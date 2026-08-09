'use client';

import { KanbanBoard } from '@/features/boards/components/kanban-board';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

export default function BoardPage() {
  return (
    <Suspense fallback={<BoardPageFallback />}>
      <BoardPageContent />
    </Suspense>
  );
}

function BoardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && !isError && workspaces.length === 0) {
      router.replace('/onboarding');
      return;
    }

    const exists = workspaces.some((workspace) => workspace.id === workspaceId);
    if (workspaces.length > 0 && (!workspaceId || !exists)) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [isLoading, isError, router, setCurrentWorkspaceId, workspaceId, workspaces]);

  return workspaceId ? (
    <KanbanBoard
      workspaceId={workspaceId}
      initialTaskId={searchParams.get('task')}
      initialBoardId={searchParams.get('board')}
    />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
  );
}

function BoardPageFallback() {
  return <p className="text-sm text-muted-foreground">Загрузка доски...</p>;
}
