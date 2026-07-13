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
    return <p className="text-sm text-slate-500">Загрузка участников...</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900">
          <tr>
            <th className="px-4 py-2 font-medium">Участник</th>
            <th className="px-4 py-2 font-medium">Роль</th>
            {canManage ? <th className="px-4 py-2 font-medium">Действия</th> : null}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-4 py-3">
                <p className="font-medium">{member.user.name}</p>
                <p className="text-xs text-slate-500">{member.user.email}</p>
              </td>
              <td className="px-4 py-3">
                {canManage && member.userId !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(event) =>
                      updateRoleMutation.mutate({
                        memberId: member.id,
                        role: event.target.value as WorkspaceRole,
                      })
                    }
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                    {member.role}
                  </span>
                )}
              </td>
              {canManage ? (
                <td className="px-4 py-3">
                  {member.userId !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(member.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Удалить
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Вы</span>
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
