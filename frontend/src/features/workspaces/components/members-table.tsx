'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import MembersTableView from '@/vue/workspaces/MembersTable.vue';
import {
  useMembersQuery,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
  useUpdateMemberScopesMutation,
} from '../hooks';
import type { WorkspaceRole, WorkspaceScope } from '../types';

interface MembersTableProps {
  workspaceId: string;
  currentUserId: string;
  canManage: boolean;
}

const ASSIGNABLE_ROLES: Array<{ value: WorkspaceRole; label: string }> = [
  { value: 'VIEWER', label: 'Наблюдатель' },
  { value: 'MEMBER', label: 'Участник' },
  { value: 'ADMIN', label: 'Админ' },
  { value: 'OWNER', label: 'Владелец' },
];

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  VIEWER: 'Наблюдатель',
  MEMBER: 'Участник',
  ADMIN: 'Админ',
  OWNER: 'Владелец',
};

const EXTRA_SCOPES: Array<{ id: WorkspaceScope; label: string }> = [
  { id: 'CRM_WRITE', label: 'CRM' },
  { id: 'FORMS_WRITE', label: 'Формы' },
  { id: 'TASK_DELETE', label: 'Удал. задач' },
  { id: 'DEAL_DELETE', label: 'Удал. сделок' },
];

export function MembersTable({ workspaceId, currentUserId, canManage }: MembersTableProps) {
  const { data: members = [], isLoading, isError, error, refetch } = useMembersQuery(workspaceId);
  const updateRoleMutation = useUpdateMemberRoleMutation(workspaceId);
  const updateScopesMutation = useUpdateMemberScopesMutation(workspaceId);
  const removeMutation = useRemoveMemberMutation(workspaceId);
  const [actionError, setActionError] = useState('');

  const onUpdateRole = useCallback(
    async (payload: { memberId: string; role: string }) => {
      setActionError('');
      try {
        await updateRoleMutation.mutateAsync({
          memberId: payload.memberId,
          role: payload.role as WorkspaceRole,
        });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось изменить роль');
      }
    },
    [updateRoleMutation],
  );

  const onUpdateScopes = useCallback(
    async (payload: { memberId: string; scopes: string[] }) => {
      setActionError('');
      try {
        await updateScopesMutation.mutateAsync({
          memberId: payload.memberId,
          scopes: payload.scopes as WorkspaceScope[],
        });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось изменить права');
      }
    },
    [updateScopesMutation],
  );

  const onRemove = useCallback(
    async (memberId: string) => {
      setActionError('');
      try {
        await removeMutation.mutateAsync(memberId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось удалить участника');
      }
    },
    [removeMutation],
  );

  const tableProps = useMemo(
    () => ({
      members,
      isLoading,
      isError,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить участников'
        : '',
      actionError,
      currentUserId,
      canManage,
      assignableRoles: ASSIGNABLE_ROLES,
      roleLabels: ROLE_LABELS,
      extraScopes: EXTRA_SCOPES,
      onRetryLoad: () => {
        void refetch();
      },
      onUpdateRole,
      onUpdateScopes,
      onRemove,
    }),
    [
      members,
      isLoading,
      isError,
      error,
      actionError,
      currentUserId,
      canManage,
      refetch,
      onUpdateRole,
      onUpdateScopes,
      onRemove,
    ],
  );

  return <VueIsland component={MembersTableView} componentProps={tableProps} />;
}
