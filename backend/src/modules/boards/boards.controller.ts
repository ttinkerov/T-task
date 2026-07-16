import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { BoardsService } from './boards.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateColumnAutomationsDto } from './dto/update-column-automations.dto';

@Controller('workspaces/:workspaceId/board')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async getBoard(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const board = await this.boardsService.getBoard(workspaceId, user.id);
    return successResponse(board);
  }

  @Post('columns')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async createColumn(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateColumnDto,
  ) {
    const column = await this.boardsService.createColumn(workspaceId, user.id, dto);
    return successResponse(column);
  }

  @Patch('columns/:columnId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async updateColumn(
    @Param('workspaceId') workspaceId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateColumnDto,
  ) {
    const column = await this.boardsService.updateColumn(workspaceId, columnId, user.id, dto);
    return successResponse(column);
  }

  @Get('columns/:columnId/automations')
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async getColumnAutomations(
    @Param('workspaceId') workspaceId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const automations = await this.boardsService.getColumnAutomations(
      workspaceId,
      columnId,
      user.id,
    );
    return successResponse(automations);
  }

  @Put('columns/:columnId/automations')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async updateColumnAutomations(
    @Param('workspaceId') workspaceId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateColumnAutomationsDto,
  ) {
    const automations = await this.boardsService.updateColumnAutomations(
      workspaceId,
      columnId,
      user.id,
      dto,
    );
    return successResponse(automations);
  }

  @Patch('columns/:columnId/move')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async moveColumn(
    @Param('workspaceId') workspaceId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MoveColumnDto,
  ) {
    const column = await this.boardsService.moveColumn(workspaceId, columnId, user.id, dto);
    return successResponse(column);
  }

  @Delete('columns/:columnId')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async deleteColumn(
    @Param('workspaceId') workspaceId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.boardsService.deleteColumn(workspaceId, columnId, user.id);
    return successResponse(result);
  }
}
