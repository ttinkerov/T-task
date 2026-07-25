'use client';

import { AllTasksPage } from '@/features/all-tasks';
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

  return workspaceId ? (
    <AllTasksPage
      key={workspaceId}
      workspaceId={workspaceId}
      initialTaskId={searchParams.get('task')}
    />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}

function AllTasksRouteFallback() {
  return <p className="text-sm text-muted-foreground">Загрузка задач...</p>;
}
