'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useWorkspacesQuery } from '../hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';

export function WorkspaceSwitcher() {
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);

  useEffect(() => {
    if (!workspaces.length) {
      return;
    }

    const exists = workspaces.some((workspace) => workspace.id === currentWorkspaceId);

    if (!currentWorkspaceId || !exists) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [currentWorkspaceId, setCurrentWorkspaceId, workspaces]);

  if (isLoading || !workspaces.length) {
    return null;
  }

  const current = workspaces.find((workspace) => workspace.id === currentWorkspaceId);

  return (
    <div className="workspace-switcher">
      <select
        value={currentWorkspaceId ?? ''}
        onChange={(event) => setCurrentWorkspaceId(event.target.value)}
        className="workspace-switcher__select"
        aria-label="Выбор команды"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>

      {current ? (
        <Link
          href={`/dashboard/workspaces/${current.id}/settings`}
          className="dashboard-header__icon-btn"
          title="Настройки команды"
          aria-label="Настройки команды"
        >
          ⚙
        </Link>
      ) : null}
    </div>
  );
}
