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

export async function createWorkspace(name: string) {
  return apiFetch<WorkspaceSummary>('/api/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function fetchWorkspace(workspaceId: string) {
  return apiFetch<WorkspaceSummary>(`/api/v1/workspaces/${workspaceId}`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function updateWorkspace(workspaceId: string, name: string) {
  return apiFetch<WorkspaceSummary>(`/api/v1/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name }),
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
) {
  return apiFetch<CreatedInvitation>(`/api/v1/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ email, role }),
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
