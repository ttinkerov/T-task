'use client';

import { ActivityPage } from '@/features/activity/components/activity-page';
import { useCanViewActivity } from '@/features/activity/hooks';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';

export default function WorkspaceActivityRoutePage() {
  const { canView, isLoading, isError, onRetry, workspaceId } = useCanViewActivity();

  if (isLoading || isError || !workspaceId) {
    return <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />;
  }

  if (canView) {
    return <ActivityPage workspaceId={workspaceId} />;
  }

  return (
    <section className="activity-page__empty" aria-label="Доступ ограничен">
      <h2>Журнал доступен администраторам</h2>
      <p>Просматривать действия могут владельцы и администраторы рабочего пространства.</p>
    </section>
  );
}
