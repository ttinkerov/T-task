'use client';

import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { RoadmapPage } from '@/features/roadmap';
import { useWorkspaceStore } from '@/stores/workspace.store';
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
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return (
    <DashboardShell boardMode>
      {workspaceId ? (
        <RoadmapPage
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

function RoadmapRouteFallback() {
  return (
    <DashboardShell boardMode>
      <p className="text-sm text-muted-foreground">Загрузка роадмапа...</p>
    </DashboardShell>
  );
}
