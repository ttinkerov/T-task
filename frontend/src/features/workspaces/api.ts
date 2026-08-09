import { apiFetch } from '@/shared/api/client';
import type {
  CreatedInvitation,
  InvitationPreview,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSummary,
} from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function fetchWorkspaces() {
  return apiFetch<WorkspaceSummary[]>('/api/v1/workspaces');
}

export async function createWorkspace(data: {
  name: string;
  teamSize?: string;
  useCases?: string[];
}) {
  return apiFetch<WorkspaceSummary>('/api/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchWorkspace(workspaceId: string) {
  return apiFetch<WorkspaceSummary>(`/api/v1/workspaces/${workspaceId}`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function updateWorkspace(
  workspaceId: string,
  data: { name?: string; autoRollOverdue?: boolean },
) {
  return apiFetch<WorkspaceSummary>(`/api/v1/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function fetchMembers(workspaceId: string) {
  return apiFetch<WorkspaceMember[]>(`/api/v1/workspaces/${workspaceId}/members`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function updateMemberRole(workspaceId: string, memberId: string, role: WorkspaceRole) {
  return apiFetch<WorkspaceMember>(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ role }),
  });
}

export async function updateMemberScopes(workspaceId: string, memberId: string, scopes: string[]) {
  return apiFetch<WorkspaceMember>(`/api/v1/workspaces/${workspaceId}/members/${memberId}/scopes`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ scopes }),
  });
}

export async function removeMember(workspaceId: string, memberId: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchInvitations(workspaceId: string) {
  return apiFetch<WorkspaceInvitation[]>(`/api/v1/workspaces/${workspaceId}/invitations`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createInvitation(
  workspaceId: string,
  email: string,
  role: WorkspaceRole = 'MEMBER',
  sendEmail = true,
) {
  return apiFetch<CreatedInvitation>(`/api/v1/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ email, role, sendEmail }),
  });
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
  return apiFetch<{ success: boolean }>(
    `/api/v1/workspaces/${workspaceId}/invitations/${invitationId}`,
    {
      method: 'DELETE',
      headers: withWorkspace(workspaceId),
    },
  );
}

export async function fetchInvitationPreview(token: string) {
  return apiFetch<InvitationPreview>(`/api/v1/invitations/${token}`);
}

export async function acceptInvitation(token: string) {
  return apiFetch<{ workspace: WorkspaceSummary }>(`/api/v1/invitations/${token}/accept`, {
    method: 'POST',
  });
}
