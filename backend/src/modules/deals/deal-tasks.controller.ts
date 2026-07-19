import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { DEAL_TASK_MUTATE_RATE_LIMIT, RateLimit } from '../../common/security/rate-limit.decorator';
import { DealTasksService } from './deal-tasks.service';
import { LinkDealTaskDto } from './dto/link-deal-task.dto';

@Controller('workspaces/:workspaceId/deals/:dealId/tasks')
export class DealTasksController {
  constructor(private readonly dealTasksService: DealTasksService) {}

  @Get()
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.dealTasksService.listTasksForDeal(workspaceId, dealId, user.id),
    );
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DEAL_TASK_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async link(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LinkDealTaskDto,
  ) {
    return successResponse(
      await this.dealTasksService.linkFromDeal(workspaceId, dealId, dto.taskId, user.id),
    );
  }

  @Delete(':taskId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DEAL_TASK_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async unlink(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.dealTasksService.unlinkFromDeal(workspaceId, dealId, taskId, user.id),
    );
  }
}
