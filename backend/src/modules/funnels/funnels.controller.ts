import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { CreateFunnelDto } from './dto/create-funnel.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { FunnelsService } from './funnels.service';

@Controller('workspaces/:workspaceId/funnels')
export class FunnelsController {
  constructor(private readonly funnelsService: FunnelsService) {}

  @Get()
  @Roles(...ALL_WORKSPACE_ROLES)
  async listFunnels(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const funnels = await this.funnelsService.listFunnels(workspaceId, user.id);
    return successResponse(funnels);
  }

  @Post()
  @Roles(...MEMBER_PLUS_ROLES)
  async createFunnel(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFunnelDto,
  ) {
    const funnel = await this.funnelsService.createFunnel(workspaceId, user.id, dto);
    return successResponse(funnel);
  }

  @Get(':funnelId')
  @Roles(...ALL_WORKSPACE_ROLES)
  async getFunnel(
    @Param('workspaceId') workspaceId: string,
    @Param('funnelId') funnelId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const funnel = await this.funnelsService.getFunnel(workspaceId, funnelId, user.id);
    return successResponse(funnel);
  }

  @Post(':funnelId/stages')
  @Roles(...MEMBER_PLUS_ROLES)
  async createStage(
    @Param('workspaceId') workspaceId: string,
    @Param('funnelId') funnelId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStageDto,
  ) {
    const stage = await this.funnelsService.createStage(workspaceId, funnelId, user.id, dto);
    return successResponse(stage);
  }

  @Patch(':funnelId/stages/:stageId')
  @Roles(...MEMBER_PLUS_ROLES)
  async updateStage(
    @Param('workspaceId') workspaceId: string,
    @Param('funnelId') funnelId: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStageDto,
  ) {
    const stage = await this.funnelsService.updateStage(
      workspaceId,
      funnelId,
      stageId,
      user.id,
      dto,
    );
    return successResponse(stage);
  }

  @Patch(':funnelId/stages/:stageId/move')
  @Roles(...MEMBER_PLUS_ROLES)
  async moveStage(
    @Param('workspaceId') workspaceId: string,
    @Param('funnelId') funnelId: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MoveStageDto,
  ) {
    const stage = await this.funnelsService.moveStage(workspaceId, funnelId, stageId, user.id, dto);
    return successResponse(stage);
  }

  @Delete(':funnelId/stages/:stageId')
  @Roles(...MEMBER_PLUS_ROLES)
  async deleteStage(
    @Param('workspaceId') workspaceId: string,
    @Param('funnelId') funnelId: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.funnelsService.deleteStage(workspaceId, funnelId, stageId, user.id);
    return successResponse(result);
  }
}
