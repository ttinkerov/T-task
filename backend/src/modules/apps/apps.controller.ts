import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { AppsService } from './apps.service';
import { CreateExternalAppDto } from './dto/create-external-app.dto';

@Controller('workspaces/:workspaceId/apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.appsService.list(workspaceId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'apps:create', windowSeconds: 60, maxAttempts: 30 })
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExternalAppDto,
  ) {
    return successResponse(await this.appsService.create(workspaceId, user.id, dto));
  }

  @Delete(':appId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'apps:delete', windowSeconds: 60, maxAttempts: 30 })
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('appId') appId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.appsService.remove(workspaceId, appId, user.id));
  }
}
