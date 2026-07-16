'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { useMeQuery } from '@/features/auth/hooks';
import { InviteMemberForm, InvitationsList, MembersTable } from '@/features/workspaces';
import { WorkspaceOverdueSettings } from '@/features/workspaces/components/workspace-overdue-settings';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';

export default function WorkspaceSettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const { data: session } = useMeQuery();
  const { data: workspaces = [] } = useWorkspacesQuery();

  const workspace = workspaces.find((item) => item.id === workspaceId);
  const canManage = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';

  return (
    <DashboardShell>
      <section className="settings-page">
        <div className="settings-page__header">
          <Link href="/dashboard/board" className="settings-page__back">
            ← К доске
          </Link>
          <h1 className="settings-page__title">{workspace?.name ?? 'Настройки команды'}</h1>
          <p className="settings-page__subtitle">Участники, роли и приглашения</p>
        </div>

        {session && workspace ? (
          <>
            <div className="settings-card">
              <h2 className="settings-card__title">Участники</h2>
              <MembersTable
                workspaceId={workspaceId}
                currentUserId={session.user.id}
                canManage={canManage}
              />
            </div>

            {canManage ? (
              <>
                <WorkspaceOverdueSettings workspaceId={workspaceId} canManage={canManage} />
                <div className="settings-card">
                  <h2 className="settings-card__title">Пригласить участника</h2>
                  <InviteMemberForm workspaceId={workspaceId} />
                </div>
                <div className="settings-card">
                  <h2 className="settings-card__title">Активные приглашения</h2>
                  <InvitationsList workspaceId={workspaceId} />
                </div>
              </>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Команда не найдена или нет доступа.</p>
        )}
      </section>
    </DashboardShell>
  );
}
