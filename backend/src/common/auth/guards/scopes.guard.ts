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
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { SCOPES_KEY } from '../decorators/scopes.decorator';
import { hasEffectiveScope, type WorkspaceScopeValue } from '../scopes';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<WorkspaceScopeValue[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        user?: AuthenticatedUser;
        workspaceMembership?: {
          workspaceId: string;
          role: WorkspaceRole;
          scopes: string[];
        };
      }
    >();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    let membership = request.workspaceMembership;

    if (!membership) {
      const workspaceId =
        (request.params.workspaceId as string | undefined) ??
        (request.headers['x-workspace-id'] as string | undefined);

      if (!workspaceId) {
        throw new ForbiddenException('Workspace context is required');
      }

      const row = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: request.user.id },
        },
      });

      if (!row) {
        throw new ForbiddenException('You are not a member of this workspace');
      }

      membership = {
        workspaceId,
        role: row.role,
        scopes: row.scopes ?? [],
      };
      request.workspaceMembership = membership;
    }

    const scopes = membership.scopes ?? [];
    const missing = required.filter((scope) => !hasEffectiveScope(membership!.role, scopes, scope));

    if (missing.length > 0) {
      throw new ForbiddenException('Insufficient workspace scopes');
    }

    return true;
  }
}
