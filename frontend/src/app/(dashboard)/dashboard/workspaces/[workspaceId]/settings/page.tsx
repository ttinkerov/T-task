'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { useMeQuery } from '@/features/auth/hooks';
import { InviteMemberForm, InvitationsList, MembersTable } from '@/features/workspaces';
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
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-slate-500 underline">
              ← Назад
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">
              {workspace?.name ?? 'Настройки команды'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Участники, роли и приглашения
            </p>
          </div>
        </div>

        {session && workspace ? (
          <>
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-slate-500">Участники</h2>
              <MembersTable
                workspaceId={workspaceId}
                currentUserId={session.user.id}
                canManage={canManage}
              />
            </div>

            {canManage ? (
              <>
                <InviteMemberForm workspaceId={workspaceId} />
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-slate-500">Активные приглашения</h2>
                  <InvitationsList workspaceId={workspaceId} />
                </div>
              </>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">Команда не найдена или нет доступа.</p>
        )}
      </section>
    </DashboardShell>
  );
}
