'use client';

import { AllTasksPage } from '@/features/all-tasks';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { useMeQuery } from '@/features/auth/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
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
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: session } = useMeQuery();
  const userId = session?.user.id ?? null;

  return (
    <DashboardShell boardMode>
      {workspaceId && userId ? (
        <AllTasksPage
          key={`${workspaceId}:${userId}`}
          workspaceId={workspaceId}
          initialTaskId={searchParams.get('task')}
          lockedAssigneeId={userId}
          title="Мои задачи"
          description="Только задачи, где вы назначены исполнителем."
          linkSource="my-tasks"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {workspaceId ? 'Загрузка профиля...' : 'Выберите команду справа в шапке.'}
        </p>
      )}
    </DashboardShell>
  );
}

function MyTasksFallback() {
  return (
    <DashboardShell boardMode>
      <p className="text-sm text-muted-foreground">Загрузка задач...</p>
    </DashboardShell>
  );
}
