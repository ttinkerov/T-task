'use client';

import { CalendarIntegrationPage } from '@/features/calendar';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function CalendarIntegrationRoutePage() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

  return workspaceId ? (
    <CalendarIntegrationPage key={workspaceId} workspaceId={workspaceId} />
  ) : (
    <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
  );
}
