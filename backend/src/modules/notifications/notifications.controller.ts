import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  NOTIFICATION_MUTATE_RATE_LIMIT,
  NOTIFICATION_READ_RATE_LIMIT,
  RateLimit,
} from '../../common/security/rate-limit.decorator';
import { NotificationsService } from './notifications.service';

@Controller('workspaces/:workspaceId/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(NOTIFICATION_READ_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.notificationsService.list(workspaceId, user.id));
  }

  @Patch('read-all')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(NOTIFICATION_MUTATE_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async markAllRead(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.notificationsService.markAllRead(workspaceId, user.id));
  }

  @Patch(':notificationId/read')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(NOTIFICATION_MUTATE_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async markRead(
    @Param('workspaceId') workspaceId: string,
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.notificationsService.markRead(workspaceId, notificationId, user.id),
    );
  }
}
