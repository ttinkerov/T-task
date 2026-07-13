'use client';

import { useMeQuery } from '@/features/auth/hooks';
import { CreateWorkspaceForm } from '@/features/workspaces/components/create-workspace-form';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace.store';

export function DashboardContent() {
  const { data: session } = useMeQuery();
  const { data: workspaces = [] } = useWorkspacesQuery();
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const currentWorkspace = workspaces.find((workspace) => workspace.id === currentWorkspaceId);

  if (!session) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Добро пожаловать, {session.user.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управляйте командами, участниками и приглашениями.
        </p>
      </div>

      <div className="glass-panel space-y-3 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-muted-foreground">Активная команда</h2>
        <WorkspaceSwitcher />
        {currentWorkspace ? (
          <p className="text-sm text-muted-foreground">
            Роль: <span className="font-medium text-foreground">{currentWorkspace.role}</span>
          </p>
        ) : null}
        <CreateWorkspaceForm />
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <h2 className="text-sm font-medium text-muted-foreground">Все команды</h2>
        <ul className="mt-3 space-y-2">
          {workspaces.map((workspace) => (
            <li
              key={workspace.id}
              className="flex items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2"
            >
              <div>
                <p className="font-medium">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">{workspace.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {workspace.role}
                </span>
                <Link
                  href={`/dashboard/workspaces/${workspace.id}/settings`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Настройки
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
