'use client';

import { FunnelBoard } from '@/features/crm';
import { downloadExport } from '@/features/workspace-tools/api';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CrmPage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, workspaces.length]);

  return workspaceId ? (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button
          type="button"
          className="board-filters__chip"
          onClick={() => void downloadExport(workspaceId, 'deals')}
        >
          Экспорт CSV
        </button>
      </div>
      <FunnelBoard workspaceId={workspaceId} />
    </>
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
