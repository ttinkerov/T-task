import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { ActivityService } from './activity.service';
import { ListActivityQueryDto } from './dto/list-activity-query.dto';

@Controller('workspaces/:workspaceId/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'activity:list', windowSeconds: 60, maxAttempts: 60 })
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListActivityQueryDto,
  ) {
    const result = await this.activityService.list(workspaceId, user.id, query);
    return successResponse(result.items, result.meta);
  }
}
