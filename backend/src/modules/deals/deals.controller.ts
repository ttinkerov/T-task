import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { Scopes } from '../../common/auth/decorators/scopes.decorator';
import { WorkspaceScope } from '../../common/auth/scopes';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { DEAL_MUTATE_RATE_LIMIT, RateLimit } from '../../common/security/rate-limit.decorator';
import { ApplyDealTemplateDto } from '../templates/dto/apply-deal-template.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { MoveDealDto } from './dto/move-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealsService } from './deals.service';

@Controller('workspaces/:workspaceId/deals')
@UseGuards(AuthRateLimitGuard)
@RateLimit(DEAL_MUTATE_RATE_LIMIT)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Roles(...ALL_WORKSPACE_ROLES)
  @Scopes(WorkspaceScope.CRM_WRITE)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDealDto,
  ) {
    const deal = await this.dealsService.create(workspaceId, user.id, dto);
    return successResponse(deal);
  }

  @Patch(':dealId')
  @Roles(...ALL_WORKSPACE_ROLES)
  @Scopes(WorkspaceScope.CRM_WRITE)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDealDto,
  ) {
    const deal = await this.dealsService.update(workspaceId, dealId, user.id, dto);
    return successResponse(deal);
  }

  @Patch(':dealId/move')
  @Roles(...ALL_WORKSPACE_ROLES)
  @Scopes(WorkspaceScope.CRM_WRITE)
  async move(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MoveDealDto,
  ) {
    const deal = await this.dealsService.move(workspaceId, dealId, user.id, dto);
    return successResponse(deal);
  }

  @Post(':dealId/apply-template')
  @Roles(...ALL_WORKSPACE_ROLES)
  @Scopes(WorkspaceScope.CRM_WRITE)
  async applyTemplate(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyDealTemplateDto,
  ) {
    const deal = await this.dealsService.applyTemplate(
      workspaceId,
      dealId,
      user.id,
      dto.templateId,
    );
    return successResponse(deal);
  }

  @Delete(':dealId')
  @Roles(...ALL_WORKSPACE_ROLES)
  @Scopes(WorkspaceScope.DEAL_DELETE)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.dealsService.remove(workspaceId, dealId, user.id);
    return successResponse(result);
  }
}
