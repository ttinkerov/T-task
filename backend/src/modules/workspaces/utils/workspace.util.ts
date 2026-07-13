import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { slugify } from '../../../common/auth/utils/token.util';

export async function createUniqueWorkspaceSlug(
  prisma: PrismaService | { workspace: PrismaService['workspace'] },
  baseName: string,
): Promise<string> {
  const baseSlug = slugify(baseName) || 'workspace';
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

const ROLE_RANK: Record<WorkspaceRole, number> = {
  [WorkspaceRole.VIEWER]: 1,
  [WorkspaceRole.MEMBER]: 2,
  [WorkspaceRole.ADMIN]: 3,
  [WorkspaceRole.OWNER]: 4,
};

export function hasMinimumRole(role: WorkspaceRole, minimum: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function assertCanAssignRole(actorRole: WorkspaceRole, newRole: WorkspaceRole): void {
  if (newRole === WorkspaceRole.OWNER && actorRole !== WorkspaceRole.OWNER) {
    throw new Error('ONLY_OWNER_CAN_ASSIGN_OWNER');
  }

  if (
    actorRole === WorkspaceRole.ADMIN &&
    (newRole === WorkspaceRole.OWNER || newRole === WorkspaceRole.ADMIN)
  ) {
    throw new Error('ADMIN_CANNOT_ASSIGN_ADMIN_OR_OWNER');
  }
}
