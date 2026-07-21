import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { DOD_MUTATE_RATE_LIMIT, RateLimit } from '../../common/security/rate-limit.decorator';
import { ApplyDodTemplateDto } from './dto/apply-dod-template.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { TaskChecklistService } from './task-checklist.service';

@Controller('workspaces/:workspaceId/tasks/:taskId/checklist')
export class TaskChecklistController {
  constructor(private readonly taskChecklistService: TaskChecklistService) {}

  @Get()
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.taskChecklistService.list(workspaceId, taskId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DOD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateChecklistItemDto,
  ) {
    return successResponse(
      await this.taskChecklistService.create(workspaceId, taskId, user.id, dto),
    );
  }

  @Post('apply-template')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DOD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async applyTemplate(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyDodTemplateDto,
  ) {
    return successResponse(
      await this.taskChecklistService.applyTemplate(workspaceId, taskId, user.id, dto),
    );
  }

  @Patch(':itemId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DOD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return successResponse(
      await this.taskChecklistService.update(workspaceId, taskId, itemId, user.id, dto),
    );
  }

  @Delete(':itemId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DOD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.taskChecklistService.remove(workspaceId, taskId, itemId, user.id),
    );
  }
}
