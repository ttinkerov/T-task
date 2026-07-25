import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { TaskBacklinksService } from './task-backlinks.service';

@Controller('workspaces/:workspaceId/tasks/:taskId/backlinks')
export class TaskBacklinksController {
  constructor(private readonly taskBacklinksService: TaskBacklinksService) {}

  @Get()
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.taskBacklinksService.list(workspaceId, taskId, user.id));
  }
}
