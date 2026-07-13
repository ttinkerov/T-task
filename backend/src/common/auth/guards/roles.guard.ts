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
        workspaceMembership?: { workspaceId: string; role: WorkspaceRole };
      }
    >();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const workspaceId =
      (request.headers[WORKSPACE_ID_HEADER] as string | undefined) ??
      (request.params.workspaceId as string | undefined);

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
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.workspaceMembership = {
      workspaceId,
      role: membership.role,
    };

    return true;
  }
}
