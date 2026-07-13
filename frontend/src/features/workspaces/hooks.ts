import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/hooks';
import { boardKeys } from '@/features/boards/hooks';
import {
  acceptInvitation,
  createInvitation,
  createWorkspace,
  fetchInvitationPreview,
  fetchInvitations,
  fetchMembers,
  fetchWorkspaces,
  removeMember,
  revokeInvitation,
  updateMemberRole,
  updateWorkspace,
} from './api';
import type { WorkspaceRole } from './types';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceKeys.all, 'list'] as const,
  members: (workspaceId: string) => [...workspaceKeys.all, workspaceId, 'members'] as const,
  invitations: (workspaceId: string) => [...workspaceKeys.all, workspaceId, 'invitations'] as const,
  invitationPreview: (token: string) => [...workspaceKeys.all, 'invite', token] as const,
};

export function useWorkspacesQuery() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: async () => {
      const response = await fetchWorkspaces();
      return response.data ?? [];
    },
  });
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; teamSize?: string; useCases?: string[] }) => {
      const response = await createWorkspace(data);
      return response.data;
    },
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      if (workspace?.id) {
        void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspace.id) });
      }
    },
  });
}

export function useMembersQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchMembers(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useInvitationsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.invitations(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchInvitations(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useUpdateWorkspaceMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await updateWorkspace(workspaceId, name);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useUpdateMemberRoleMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: WorkspaceRole }) => {
      const response = await updateMemberRole(workspaceId, memberId, role);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
    },
  });
}

export function useRemoveMemberMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      await removeMember(workspaceId, memberId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
    },
  });
}

export function useCreateInvitationMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role?: WorkspaceRole }) => {
      const response = await createInvitation(workspaceId, email, role);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.invitations(workspaceId) });
    },
  });
}

export function useRevokeInvitationMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      await revokeInvitation(workspaceId, invitationId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.invitations(workspaceId) });
    },
  });
}

export function useInvitationPreviewQuery(token: string) {
  return useQuery({
    queryKey: workspaceKeys.invitationPreview(token),
    queryFn: async () => {
      const response = await fetchInvitationPreview(token);
      return response.data;
    },
  });
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await acceptInvitation(token);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
