import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  RateLimit,
  RESOURCE_READ_RATE_LIMIT,
  TEMPLATE_MUTATE_RATE_LIMIT,
} from '../../common/security/rate-limit.decorator';
import { CreateDealTemplateDto } from './dto/create-deal-template.dto';
import { UpdateDealTemplateDto } from './dto/update-deal-template.dto';
import { DealTemplatesService } from './deal-templates.service';

@Controller('workspaces/:workspaceId/deal-templates')
export class DealTemplatesController {
  constructor(private readonly dealTemplatesService: DealTemplatesService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(RESOURCE_READ_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.dealTemplatesService.list(workspaceId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TEMPLATE_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDealTemplateDto,
  ) {
    return successResponse(await this.dealTemplatesService.create(workspaceId, user.id, dto));
  }

  @Post('seed-defaults')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TEMPLATE_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async seedDefaults(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.dealTemplatesService.seedDefaults(workspaceId, user.id));
  }

  @Patch(':templateId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TEMPLATE_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('templateId') templateId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDealTemplateDto,
  ) {
    return successResponse(
      await this.dealTemplatesService.update(workspaceId, templateId, user.id, dto),
    );
  }

  @Delete(':templateId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(TEMPLATE_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('templateId') templateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.dealTemplatesService.remove(workspaceId, templateId, user.id),
    );
  }
}
