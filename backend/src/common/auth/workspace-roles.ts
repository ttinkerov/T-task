import { WorkspaceRole } from '@prisma/client';

/** Any workspace member (read-capable). */
export const ALL_WORKSPACE_ROLES = [
  WorkspaceRole.VIEWER,
  WorkspaceRole.MEMBER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.OWNER,
] as const;

/** Members who can mutate workspace content. */
export const MEMBER_PLUS_ROLES = [
  WorkspaceRole.MEMBER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.OWNER,
] as const;

/** Admin and owner only. */
export const ADMIN_PLUS_ROLES = [WorkspaceRole.ADMIN, WorkspaceRole.OWNER] as const;
