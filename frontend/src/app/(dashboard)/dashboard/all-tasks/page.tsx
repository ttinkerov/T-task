'use client';

import { AllTasksPage } from '@/features/all-tasks';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { useWorkspaceStore } from '@/stores/workspace.store';
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
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return (
    <DashboardShell boardMode>
      {workspaceId ? (
        <AllTasksPage
          key={workspaceId}
          workspaceId={workspaceId}
          initialTaskId={searchParams.get('task')}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
      )}
    </DashboardShell>
  );
}

function AllTasksRouteFallback() {
  return (
    <DashboardShell boardMode>
      <p className="text-sm text-muted-foreground">Загрузка задач...</p>
    </DashboardShell>
  );
}
