'use client';

import { MyTasksPage } from '@/features/all-tasks/components/my-tasks-page';
import { useMeQuery } from '@/features/auth/hooks';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspaceRouteGate } from '@/features/workspaces/use-workspace-route-gate';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function MyTasksRoute() {
  return (
    <Suspense fallback={<MyTasksFallback />}>
      <MyTasksContent />
    </Suspense>
  );
}

function MyTasksContent() {
  const searchParams = useSearchParams();
  const { workspaceId, isReady, isLoading, isError, onRetry } = useWorkspaceRouteGate();
  const {
    data: session,
    isLoading: sessionLoading,
    isError: sessionError,
    refetch: refetchSession,
  } = useMeQuery();
  const userId = session?.user.id ?? null;

  if (isReady && workspaceId && userId) {
    return (
      <MyTasksPage
        key={`${workspaceId}:${userId}`}
        workspaceId={workspaceId}
        userId={userId}
        initialTaskId={searchParams.get('task')}
        initialSection={searchParams.get('section')}
      />
    );
  }

  if (!isReady) {
    return <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />;
  }

  if (sessionError) {
    return (
      <div className="text-sm" role="alert">
        <p className="text-red-400">Не удалось загрузить профиль.</p>
        <button type="button" className="board-filters__chip" onClick={() => void refetchSession()}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground" role="status">
      {sessionLoading ? 'Загрузка профиля…' : 'Не удалось определить пользователя.'}
    </p>
  );
}

function MyTasksFallback() {
  return <p className="text-sm text-muted-foreground">Загрузка задач...</p>;
}
