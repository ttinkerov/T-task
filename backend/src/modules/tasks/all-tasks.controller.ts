import { Controller, Get, Param, Query } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AllTasksService } from './all-tasks.service';
import { ListAllTasksQueryDto } from './dto/list-all-tasks-query.dto';

@Controller('workspaces/:workspaceId/all-tasks')
export class AllTasksController {
  constructor(private readonly allTasksService: AllTasksService) {}

  @Get()
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAllTasksQueryDto,
  ) {
    const result = await this.allTasksService.list(workspaceId, user.id, query);
    return successResponse(result, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }
}
