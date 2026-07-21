import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import {
  ADMIN_PLUS_ROLES,
  ALL_WORKSPACE_ROLES,
  MEMBER_PLUS_ROLES,
} from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat.dto';
import { SummarizeAiDto } from './dto/summarize-ai.dto';
import { UpsertAiSettingsDto } from './dto/upsert-ai-settings.dto';

@Controller('workspaces/:workspaceId/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('settings')
  @Roles(...ALL_WORKSPACE_ROLES)
  async getSettings(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.aiService.getSettings(workspaceId, user.id));
  }

  @Put('settings')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'ai:settings', windowSeconds: 60, maxAttempts: 10 })
  @Roles(...ADMIN_PLUS_ROLES)
  async upsertSettings(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertAiSettingsDto,
  ) {
    return successResponse(await this.aiService.upsertSettings(workspaceId, user.id, dto));
  }

  @Delete('settings')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'ai:settings-delete', windowSeconds: 60, maxAttempts: 10 })
  @Roles(...ADMIN_PLUS_ROLES)
  async deleteSettings(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.aiService.deleteSettings(workspaceId, user.id));
  }

  @Post('settings/test')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'ai:test', windowSeconds: 60, maxAttempts: 6 })
  @Roles(...ADMIN_PLUS_ROLES)
  async testConnection(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.aiService.testConnection(workspaceId, user.id));
  }

  @Post('chat')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({
    keyPrefix: 'ai:chat',
    windowSeconds: 60,
    maxAttempts: 20,
    includeWorkspaceId: true,
  })
  @Roles(...MEMBER_PLUS_ROLES)
  async chat(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AiChatDto,
  ) {
    return successResponse(await this.aiService.chat(workspaceId, user.id, dto));
  }

  @Post('summary')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({
    keyPrefix: 'ai:summary',
    windowSeconds: 60,
    maxAttempts: 10,
    includeWorkspaceId: true,
  })
  @Roles(...MEMBER_PLUS_ROLES)
  async summarize(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SummarizeAiDto,
  ) {
    return successResponse(await this.aiService.summarize(workspaceId, user.id, dto));
  }
}
