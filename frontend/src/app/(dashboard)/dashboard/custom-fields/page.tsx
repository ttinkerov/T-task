'use client';

import { CustomFieldsPage } from '@/features/custom-fields/components/custom-fields-page';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function CustomFieldsRoutePage() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return workspaceId ? (
    <CustomFieldsPage key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
