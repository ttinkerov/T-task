import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit, RESOURCE_READ_RATE_LIMIT } from '../../common/security/rate-limit.decorator';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { SubtasksService } from './subtasks.service';

const SUBTASK_MUTATE_RATE_LIMIT = {
  keyPrefix: 'subtask:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
};

@Controller('workspaces/:workspaceId/tasks/:taskId/subtasks')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(RESOURCE_READ_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.subtasksService.list(workspaceId, taskId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(SUBTASK_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubtaskDto,
  ) {
    return successResponse(await this.subtasksService.create(workspaceId, taskId, user.id, dto));
  }

  @Patch(':subtaskId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(SUBTASK_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return successResponse(
      await this.subtasksService.update(workspaceId, taskId, subtaskId, user.id, dto),
    );
  }

  @Delete(':subtaskId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(SUBTASK_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.subtasksService.remove(workspaceId, taskId, subtaskId, user.id),
    );
  }
}
