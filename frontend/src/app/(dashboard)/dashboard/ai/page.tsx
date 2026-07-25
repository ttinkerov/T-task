'use client';

import { AiChatPanel, AiSummaryPanel } from '@/features/ai';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AiChatRoutePage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, workspaces.length]);

  return workspaceId ? (
    <div className="ai-page">
      <AiSummaryPanel workspaceId={workspaceId} scope="day" />
      <AiChatPanel workspaceId={workspaceId} />
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
