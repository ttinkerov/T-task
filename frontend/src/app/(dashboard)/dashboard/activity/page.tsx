'use client';

import { ActivityPage } from '@/features/activity';
import { useCanViewActivity } from '@/features/activity/hooks';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';

export default function WorkspaceActivityRoutePage() {
  const { canView, isLoading, workspaceId } = useCanViewActivity();

  return (
    <DashboardShell>
      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Проверяем доступ…
        </p>
      ) : workspaceId && canView ? (
        <ActivityPage workspaceId={workspaceId} />
      ) : workspaceId ? (
        <section className="activity-page__empty" aria-label="Доступ ограничен">
          <h2>Журнал доступен администраторам</h2>
          <p>Просматривать действия могут владельцы и администраторы рабочего пространства.</p>
        </section>
      ) : (
        <section aria-label="Нет рабочего пространства">
          <h2 className="sr-only">Нет выбранной команды</h2>
          <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>
        </section>
      )}
    </DashboardShell>
  );
}
