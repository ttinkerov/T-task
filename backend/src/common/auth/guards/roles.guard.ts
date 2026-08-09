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
import { WorkspacesService } from '../../../modules/workspaces/workspaces.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser, WORKSPACE_ID_HEADER } from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workspacesService: WorkspacesService,
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
      throw new UnauthorizedException('Требуется аутентификация');
    }

    const pathWorkspaceId = request.params.workspaceId as string | undefined;
    const headerWorkspaceId = request.headers[WORKSPACE_ID_HEADER] as string | undefined;

    if (pathWorkspaceId && headerWorkspaceId && pathWorkspaceId !== headerWorkspaceId) {
      throw new ForbiddenException('Несовпадение ID рабочего пространства');
    }

    const workspaceId = pathWorkspaceId ?? headerWorkspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Требуется контекст рабочего пространства');
    }

    const membership = await this.workspacesService.resolveGuardMembership(
      workspaceId,
      request.user.id,
    );

    if (!membership) {
      throw new ForbiddenException('Вы не участник этого пространства');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }

    request.workspaceMembership = membership;

    return true;
  }
}
