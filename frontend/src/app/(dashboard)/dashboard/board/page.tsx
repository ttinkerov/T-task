'use client';

import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { KanbanBoard } from '@/features/boards';
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
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, workspaces.length]);

  return (
    <DashboardShell boardMode>
      {workspaceId ? (
        <KanbanBoard
          workspaceId={workspaceId}
          initialTaskId={searchParams.get('task')}
          initialBoardId={searchParams.get('board')}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
      )}
    </DashboardShell>
  );
}

function BoardPageFallback() {
  return (
    <DashboardShell boardMode>
      <p className="text-sm text-muted-foreground">Загрузка доски...</p>
    </DashboardShell>
  );
}
