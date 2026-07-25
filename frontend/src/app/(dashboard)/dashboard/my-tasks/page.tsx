'use client';

import { MyTasksPage } from '@/features/all-tasks';
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

  return workspaceId && userId ? (
    <MyTasksPage
      key={`${workspaceId}:${userId}`}
      workspaceId={workspaceId}
      userId={userId}
      initialTaskId={searchParams.get('task')}
    />
  ) : (
    <p className="text-sm text-muted-foreground">
      {workspaceId ? 'Загрузка профиля...' : 'Выберите команду справа в шапке.'}
    </p>
  );
}

function MyTasksFallback() {
  return <p className="text-sm text-muted-foreground">Загрузка задач...</p>;
}
