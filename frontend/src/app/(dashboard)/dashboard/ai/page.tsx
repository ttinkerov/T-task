'use client';

import { AiChatPanel } from '@/features/ai/components/ai-chat-panel';
import { AiSummaryPanel } from '@/features/ai/components/ai-summary-panel';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AiChatRoutePage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && !isError && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, isError, router, workspaces.length]);

  return workspaceId ? (
    <div className="ai-page">
      <AiSummaryPanel workspaceId={workspaceId} scope="day" />
      <AiChatPanel workspaceId={workspaceId} />
    </div>
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
  );
}
