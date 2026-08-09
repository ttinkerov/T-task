export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  autoRollOverdue?: boolean;
}

export type WorkspaceScope = 'CRM_WRITE' | 'FORMS_WRITE' | 'TASK_DELETE' | 'DEAL_DELETE';

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: WorkspaceRole;
  scopes?: WorkspaceScope[];
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
  emailSent?: boolean;
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
