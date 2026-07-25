import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { UpsertWhiteboardDto } from './dto/upsert-whiteboard.dto';
import { WhiteboardService } from './whiteboard.service';

@Controller('workspaces/:workspaceId/whiteboard')
export class WhiteboardController {
  constructor(private readonly whiteboardService: WhiteboardService) {}

  @Get()
  @Roles(...ALL_WORKSPACE_ROLES)
  async get(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.whiteboardService.get(workspaceId, user.id));
  }

  @Put()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({
    keyPrefix: 'whiteboard:upsert',
    windowSeconds: 60,
    maxAttempts: 60,
    includeWorkspaceId: true,
  })
  @Roles(...MEMBER_PLUS_ROLES)
  async upsert(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertWhiteboardDto,
  ) {
    return successResponse(await this.whiteboardService.upsert(workspaceId, user.id, dto));
  }
}
