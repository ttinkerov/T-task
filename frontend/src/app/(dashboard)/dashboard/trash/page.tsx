'use client';

import { TrashPage } from '@/features/trash/components/trash-page';
import { useCanManageTrash } from '@/features/trash';
import { WorkspaceGateStatus } from '@/features/workspaces/components/workspace-gate-status';

export default function WorkspaceTrashRoutePage() {
  const { canManage, isLoading, isError, onRetry, workspaceId } = useCanManageTrash();

  if (isLoading || isError || !workspaceId) {
    return <WorkspaceGateStatus isLoading={isLoading} isError={isError} onRetry={onRetry} />;
  }

  if (canManage) {
    return <TrashPage workspaceId={workspaceId} />;
  }

  return (
    <section className="trash-page__empty" aria-label="Доступ ограничен">
      <h2>Корзина доступна администраторам</h2>
      <p>Просматривать и восстанавливать могут владельцы и администраторы пространства.</p>
    </section>
  );
}
