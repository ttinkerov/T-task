import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  RateLimit,
  RESOURCE_READ_RATE_LIMIT,
  WATCHER_MUTATE_RATE_LIMIT,
} from '../../common/security/rate-limit.decorator';
import { WatchersService } from './watchers.service';

@Controller('workspaces/:workspaceId/tasks/:taskId/watchers')
export class WatchersController {
  constructor(private readonly watchersService: WatchersService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(RESOURCE_READ_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.watchersService.list(workspaceId, taskId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WATCHER_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async watch(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.watchersService.watch(workspaceId, taskId, user.id));
  }

  @Delete()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WATCHER_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async unwatch(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.watchersService.unwatch(workspaceId, taskId, user.id));
  }
}
