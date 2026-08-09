'use client';

import { FunnelBoard } from '@/features/crm/components/funnel-board';
import { downloadExport } from '@/features/workspace-tools/api';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function CrmPage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspacesQuery();
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    if (!isLoading && !isError && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, isError, router, workspaces.length]);

  const onExport = useCallback(async () => {
    if (!workspaceId) return;
    setExportError('');
    try {
      await downloadExport(workspaceId, 'deals');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Не удалось экспортировать CSV');
    }
  }, [workspaceId]);

  return workspaceId ? (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '0.75rem',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        {exportError ? (
          <p className="text-sm text-red-400" role="alert">
            {exportError}
          </p>
        ) : null}
        <button type="button" className="board-filters__chip" onClick={() => void onExport()}>
          Экспорт CSV
        </button>
      </div>
      <FunnelBoard workspaceId={workspaceId} />
    </>
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
  );
}
