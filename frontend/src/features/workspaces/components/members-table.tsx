'use client';

import { useCallback, useMemo } from 'react';
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

  const onUpdateRole = useCallback(
    (payload: { memberId: string; role: string }) => {
      updateRoleMutation.mutate({
        memberId: payload.memberId,
        role: payload.role as WorkspaceRole,
      });
    },
    [updateRoleMutation],
  );

  const onUpdateScopes = useCallback(
    (payload: { memberId: string; scopes: string[] }) => {
      updateScopesMutation.mutate({
        memberId: payload.memberId,
        scopes: payload.scopes as WorkspaceScope[],
      });
    },
    [updateScopesMutation],
  );

  const onRemove = useCallback(
    (memberId: string) => {
      removeMutation.mutate(memberId);
    },
    [removeMutation],
  );

  const tableProps = useMemo(
    () => ({
      members,
      isLoading,
      currentUserId,
      canManage,
      assignableRoles: ASSIGNABLE_ROLES,
      extraScopes: EXTRA_SCOPES,
      onUpdateRole,
      onUpdateScopes,
      onRemove,
    }),
    [members, isLoading, currentUserId, canManage, onUpdateRole, onUpdateScopes, onRemove],
  );

  return <VueIsland component={MembersTableView} componentProps={tableProps} />;
}
