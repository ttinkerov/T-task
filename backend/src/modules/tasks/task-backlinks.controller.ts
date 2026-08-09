import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { ALL_TASKS_RATE_LIMIT, RateLimit } from '../../common/security/rate-limit.decorator';
import { TaskBacklinksService } from './task-backlinks.service';

@Controller('workspaces/:workspaceId/tasks/:taskId/backlinks')
export class TaskBacklinksController {
  constructor(private readonly taskBacklinksService: TaskBacklinksService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(ALL_TASKS_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.taskBacklinksService.list(workspaceId, taskId, user.id));
  }
}
