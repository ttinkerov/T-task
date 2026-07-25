import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { ALL_TASKS_RATE_LIMIT, RateLimit } from '../../common/security/rate-limit.decorator';
import { AllTasksService } from './all-tasks.service';
import { ListMyTasksQueryDto } from './dto/list-my-tasks-query.dto';

@Controller('workspaces/:workspaceId/my-tasks')
export class MyTasksController {
  constructor(private readonly allTasksService: AllTasksService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(ALL_TASKS_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMyTasksQueryDto,
  ) {
    const result = await this.allTasksService.listMyTasks(workspaceId, user.id, query.limit ?? 50);
    return successResponse(result);
  }
}
