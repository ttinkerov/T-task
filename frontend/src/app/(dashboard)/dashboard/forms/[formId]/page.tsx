'use client';

import { FormEditorPage } from '@/features/forms/components/form-editor-page';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FormEditorRoutePage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && !isError && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, isError, router, workspaces.length]);

  return workspaceId && params.formId ? (
    <FormEditorPage workspaceId={workspaceId} formId={params.formId} />
  ) : (
    <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
  );
}
