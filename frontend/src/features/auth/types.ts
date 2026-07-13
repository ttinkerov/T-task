export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

export interface AuthSession {
  user: AuthUser;
  workspaces: WorkspaceSummary[];
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  workspaceName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
