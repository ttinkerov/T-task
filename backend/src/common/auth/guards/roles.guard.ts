import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser, WORKSPACE_ID_HEADER } from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        user?: AuthenticatedUser;
        workspaceMembership?: { workspaceId: string; role: WorkspaceRole; scopes?: string[] };
      }
    >();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const pathWorkspaceId = request.params.workspaceId as string | undefined;
    const headerWorkspaceId = request.headers[WORKSPACE_ID_HEADER] as string | undefined;

    if (pathWorkspaceId && headerWorkspaceId && pathWorkspaceId !== headerWorkspaceId) {
      throw new ForbiddenException('Workspace ID mismatch');
    }

    const workspaceId = pathWorkspaceId ?? headerWorkspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace context is required');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: request.user.id,
        },
      },
      include: {
        workspace: { select: { deletedAt: true, archivedAt: true } },
      },
    });

    if (!membership || membership.workspace.deletedAt) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (membership.workspace.archivedAt) {
      const isAdmin =
        membership.role === WorkspaceRole.OWNER || membership.role === WorkspaceRole.ADMIN;
      if (!isAdmin) {
        throw new ForbiddenException('Workspace is archived');
      }
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.workspaceMembership = {
      workspaceId,
      role: membership.role,
      scopes: membership.scopes ?? [],
    };

    return true;
  }
}
