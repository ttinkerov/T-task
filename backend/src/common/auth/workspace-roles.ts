import { WorkspaceRole } from '@prisma/client';

export const ALL_WORKSPACE_ROLES = [
  WorkspaceRole.VIEWER,
  WorkspaceRole.MEMBER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.OWNER,
] as const;

export const MEMBER_PLUS_ROLES = [
  WorkspaceRole.MEMBER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.OWNER,
] as const;

export const ADMIN_PLUS_ROLES = [WorkspaceRole.ADMIN, WorkspaceRole.OWNER] as const;
