import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ADMIN_PLUS_ROLES, ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { SprintsService } from './sprints.service';

@Controller('workspaces/:workspaceId/sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Get()
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.sprintsService.list(workspaceId, user.id));
  }

  @Post()
  @Roles(...ADMIN_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSprintDto,
  ) {
    return successResponse(await this.sprintsService.create(workspaceId, user.id, dto));
  }

  @Put(':sprintId')
  @Roles(...ADMIN_PLUS_ROLES)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSprintDto,
  ) {
    return successResponse(await this.sprintsService.update(workspaceId, sprintId, user.id, dto));
  }

  @Patch(':sprintId/close')
  @Roles(...ADMIN_PLUS_ROLES)
  async close(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.sprintsService.close(workspaceId, sprintId, user.id));
  }

  @Delete(':sprintId')
  @Roles(...ADMIN_PLUS_ROLES)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.sprintsService.remove(workspaceId, sprintId, user.id));
  }

  @Get('velocity')
  @Roles(...ALL_WORKSPACE_ROLES)
  async velocity(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.sprintsService.velocity(workspaceId, user.id));
  }

  @Get(':sprintId/burndown')
  @Roles(...ALL_WORKSPACE_ROLES)
  async burndown(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.sprintsService.burndown(workspaceId, sprintId, user.id));
  }
}
