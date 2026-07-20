'use client';

import {
  useUpdateMemberRoleMutation,
  useUpdateMemberScopesMutation,
  useRemoveMemberMutation,
  useMembersQuery,
} from '../hooks';
import type { WorkspaceRole, WorkspaceScope } from '../types';

interface MembersTableProps {
  workspaceId: string;
  currentUserId: string;
  canManage: boolean;
}

const ASSIGNABLE_ROLES: WorkspaceRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];
const EXTRA_SCOPES: Array<{ id: WorkspaceScope; label: string }> = [
  { id: 'CRM_WRITE', label: 'CRM' },
  { id: 'FORMS_WRITE', label: 'Формы' },
  { id: 'TASK_DELETE', label: 'Удал. задач' },
  { id: 'DEAL_DELETE', label: 'Удал. сделок' },
];

export function MembersTable({ workspaceId, currentUserId, canManage }: MembersTableProps) {
  const { data: members = [], isLoading } = useMembersQuery(workspaceId);
  const updateRoleMutation = useUpdateMemberRoleMutation(workspaceId);
  const updateScopesMutation = useUpdateMemberScopesMutation(workspaceId);
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
            {canManage ? <th>Доп. права</th> : null}
            {canManage ? <th>Действия</th> : null}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const scopes = member.scopes ?? [];
            return (
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
                    {member.role === 'VIEWER' && member.userId !== currentUserId ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {EXTRA_SCOPES.map((scope) => {
                          const checked = scopes.includes(scope.id);
                          return (
                            <label
                              key={scope.id}
                              className="text-xs"
                              style={{ display: 'inline-flex', gap: '0.25rem' }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const next = checked
                                    ? scopes.filter((item) => item !== scope.id)
                                    : [...scopes, scope.id];
                                  updateScopesMutation.mutate({
                                    memberId: member.id,
                                    scopes: next,
                                  });
                                }}
                              />
                              {scope.label}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">по роли</span>
                    )}
                  </td>
                ) : null}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
