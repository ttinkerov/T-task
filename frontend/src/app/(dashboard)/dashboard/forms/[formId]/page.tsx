'use client';

import { FormEditorPage } from '@/features/forms';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FormEditorRoutePage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, workspaces.length]);

  return workspaceId && params.formId ? (
    <FormEditorPage workspaceId={workspaceId} formId={params.formId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
