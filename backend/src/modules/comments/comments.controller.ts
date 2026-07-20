import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  MENTION_SOURCE_MUTATE_RATE_LIMIT,
  RateLimit,
} from '../../common/security/rate-limit.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('workspaces/:workspaceId/tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const comments = await this.commentsService.list(workspaceId, taskId, user.id);
    return successResponse(comments);
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(MENTION_SOURCE_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    const comment = await this.commentsService.create(workspaceId, taskId, user.id, dto);
    return successResponse(comment);
  }

  @Delete(':commentId')
  @Roles(...MEMBER_PLUS_ROLES)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.commentsService.remove(workspaceId, taskId, commentId, user.id);
    return successResponse(result);
  }
}
