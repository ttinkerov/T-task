import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { Scopes } from '../../common/auth/decorators/scopes.decorator';
import { WorkspaceScope } from '../../common/auth/scopes';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  BULK_TASK_MUTATE_RATE_LIMIT,
  MENTION_SOURCE_MUTATE_RATE_LIMIT,
  RateLimit,
} from '../../common/security/rate-limit.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateTasksDto } from './dto/bulk-update-tasks.dto';
import { TasksService } from './tasks.service';

@Controller('workspaces/:workspaceId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':taskId')
  @Roles(...ALL_WORKSPACE_ROLES)
  async getById(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.getById(workspaceId, taskId, user.id);
    return successResponse(task);
  }

  @Post()
  @Roles(...MEMBER_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ) {
    const task = await this.tasksService.create(workspaceId, user.id, dto);
    return successResponse(task);
  }

  @Patch('bulk')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(BULK_TASK_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async bulkUpdate(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkUpdateTasksDto,
  ) {
    const result = await this.tasksService.bulkUpdate(workspaceId, user.id, dto);
    return successResponse(result);
  }

  @Patch(':taskId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(MENTION_SOURCE_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(workspaceId, taskId, user.id, dto);
    return successResponse(task);
  }

  @Patch(':taskId/move')
  @Roles(...MEMBER_PLUS_ROLES)
  async move(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MoveTaskDto,
  ) {
    const task = await this.tasksService.move(workspaceId, taskId, user.id, dto);
    return successResponse(task);
  }

  @Delete(':taskId')
  @Roles(...ALL_WORKSPACE_ROLES)
  @Scopes(WorkspaceScope.TASK_DELETE)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.tasksService.remove(workspaceId, taskId, user.id);
    return successResponse(result);
  }

  @Post(':taskId/duplicate')
  @Roles(...MEMBER_PLUS_ROLES)
  async duplicate(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.duplicate(workspaceId, taskId, user.id);
    return successResponse(task);
  }
}
