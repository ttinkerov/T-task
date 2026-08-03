'use client';

import { TrashPage } from '@/features/trash/components/trash-page';
import { useCanManageTrash } from '@/features/trash';

export default function WorkspaceTrashRoutePage() {
  const { canManage, isLoading, workspaceId } = useCanManageTrash();

  return isLoading ? (
    <p className="text-sm text-muted-foreground" role="status">
      Проверяем доступ…
    </p>
  ) : workspaceId && canManage ? (
    <TrashPage workspaceId={workspaceId} />
  ) : workspaceId ? (
    <section className="trash-page__empty" aria-label="Доступ ограничен">
      <h2>Корзина доступна администраторам</h2>
      <p>Просматривать и восстанавливать могут владельцы и администраторы пространства.</p>
    </section>
  ) : (
    <section aria-label="Нет рабочего пространства">
      <h2 className="sr-only">Нет выбранной команды</h2>
      <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
    </section>
  );
}
