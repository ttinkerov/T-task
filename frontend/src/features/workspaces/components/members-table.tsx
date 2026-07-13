'use client';

import { useUpdateMemberRoleMutation, useRemoveMemberMutation, useMembersQuery } from '../hooks';
import type { WorkspaceRole } from '../types';

interface MembersTableProps {
  workspaceId: string;
  currentUserId: string;
  canManage: boolean;
}

const ASSIGNABLE_ROLES: WorkspaceRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];

export function MembersTable({ workspaceId, currentUserId, canManage }: MembersTableProps) {
  const { data: members = [], isLoading } = useMembersQuery(workspaceId);
  const updateRoleMutation = useUpdateMemberRoleMutation(workspaceId);
  const removeMutation = useRemoveMemberMutation(workspaceId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка участников...</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="settings-table">
        <thead>
          <tr>
            <th>Участник</th>
            <th>Роль</th>
            {canManage ? <th>Действия</th> : null}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <p className="font-medium">{member.user.name}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </td>
              <td>
                {canManage && member.userId !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(event) =>
                      updateRoleMutation.mutate({
                        memberId: member.id,
                        role: event.target.value as WorkspaceRole,
                      })
                    }
                    className="glass-input py-1.5"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="settings-badge">{member.role}</span>
                )}
              </td>
              {canManage ? (
                <td>
                  {member.userId !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(member.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Удалить
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Вы</span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
