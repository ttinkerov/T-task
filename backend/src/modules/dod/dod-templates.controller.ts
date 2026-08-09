import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  DOD_MUTATE_RATE_LIMIT,
  RateLimit,
  RESOURCE_READ_RATE_LIMIT,
} from '../../common/security/rate-limit.decorator';
import { CreateDodTemplateDto } from './dto/create-dod-template.dto';
import { UpdateDodTemplateDto } from './dto/update-dod-template.dto';
import { DodTemplatesService } from './dod-templates.service';

@Controller('workspaces/:workspaceId/dod-templates')
export class DodTemplatesController {
  constructor(private readonly dodTemplatesService: DodTemplatesService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(RESOURCE_READ_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.dodTemplatesService.list(workspaceId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DOD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDodTemplateDto,
  ) {
    return successResponse(await this.dodTemplatesService.create(workspaceId, user.id, dto));
  }

  @Patch(':templateId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DOD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('templateId') templateId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDodTemplateDto,
  ) {
    return successResponse(
      await this.dodTemplatesService.update(workspaceId, templateId, user.id, dto),
    );
  }

  @Delete(':templateId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(DOD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('templateId') templateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.dodTemplatesService.remove(workspaceId, templateId, user.id));
  }
}
