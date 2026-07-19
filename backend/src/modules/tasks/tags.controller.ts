import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { SetTaskTagsDto } from './dto/set-task-tags.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

const TAG_MUTATE_RATE_LIMIT = {
  keyPrefix: 'tag:mutate',
  windowSeconds: 60,
  maxAttempts: 40,
};

@Controller('workspaces/:workspaceId/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.tagsService.list(workspaceId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TAG_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTagDto,
  ) {
    return successResponse(await this.tagsService.create(workspaceId, user.id, dto));
  }

  @Patch(':tagId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TAG_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTagDto,
  ) {
    return successResponse(await this.tagsService.update(workspaceId, tagId, user.id, dto));
  }

  @Delete(':tagId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TAG_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.tagsService.remove(workspaceId, tagId, user.id));
  }
}

@Controller('workspaces/:workspaceId/tasks/:taskId/tags')
export class TaskTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Put()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TAG_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async setTags(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetTaskTagsDto,
  ) {
    return successResponse(await this.tagsService.setTaskTags(workspaceId, taskId, user.id, dto));
  }
}
