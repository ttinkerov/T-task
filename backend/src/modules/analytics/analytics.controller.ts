import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { ANALYTICS_RATE_LIMIT, RateLimit } from '../../common/security/rate-limit.decorator';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { StuckTasksQueryDto } from './dto/stuck-tasks-query.dto';
import { AnalyticsService } from './analytics.service';

@Controller('workspaces/:workspaceId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(ANALYTICS_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async summary(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return successResponse(await this.analyticsService.summary(workspaceId, user.id, query));
  }

  @Get('workload')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(ANALYTICS_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async workload(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return successResponse(await this.analyticsService.workload(workspaceId, user.id, query));
  }

  @Get('stuck-tasks')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(ANALYTICS_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async stuckTasks(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StuckTasksQueryDto,
  ) {
    return successResponse(await this.analyticsService.stuckTasks(workspaceId, user.id, query));
  }
}
