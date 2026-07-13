export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
}

export interface CreatedInvitation extends WorkspaceInvitation {
  token: string;
}

export interface InvitationPreview {
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}
