import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { CreateDealDto } from './dto/create-deal.dto';
import { MoveDealDto } from './dto/move-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealsService } from './deals.service';

@Controller('workspaces/:workspaceId/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDealDto,
  ) {
    const deal = await this.dealsService.create(workspaceId, user.id, dto);
    return successResponse(deal);
  }

  @Patch(':dealId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
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
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async move(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MoveDealDto,
  ) {
    const deal = await this.dealsService.move(workspaceId, dealId, user.id, dto);
    return successResponse(deal);
  }

  @Delete(':dealId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.dealsService.remove(workspaceId, dealId, user.id);
    return successResponse(result);
  }
}
