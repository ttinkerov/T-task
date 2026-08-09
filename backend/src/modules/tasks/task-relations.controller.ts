import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  RateLimit,
  RESOURCE_READ_RATE_LIMIT,
  TASK_RELATION_MUTATE_RATE_LIMIT,
} from '../../common/security/rate-limit.decorator';
import { CreateTaskRelationDto } from './dto/create-task-relation.dto';
import { TaskRelationsService } from './task-relations.service';

@Controller('workspaces/:workspaceId/tasks/:taskId/relations')
export class TaskRelationsController {
  constructor(private readonly taskRelationsService: TaskRelationsService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(RESOURCE_READ_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.taskRelationsService.list(workspaceId, taskId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TASK_RELATION_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskRelationDto,
  ) {
    return successResponse(
      await this.taskRelationsService.create(workspaceId, taskId, user.id, dto),
    );
  }

  @Delete(':relationId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TASK_RELATION_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('relationId') relationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.taskRelationsService.remove(workspaceId, taskId, relationId, user.id),
    );
  }
}
