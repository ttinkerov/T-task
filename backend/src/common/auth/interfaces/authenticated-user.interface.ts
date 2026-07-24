export const WORKSPACE_ID_HEADER = 'x-workspace-id';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access';
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface WorkspaceMembershipContext {
  workspaceId: string;
  role: string;
}
