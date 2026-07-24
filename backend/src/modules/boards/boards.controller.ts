import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import {
  ALL_WORKSPACE_ROLES,
  MEMBER_PLUS_ROLES,
  ADMIN_PLUS_ROLES,
} from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { BOARD_GET_RATE_LIMIT, RateLimit } from '../../common/security/rate-limit.decorator';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateColumnAutomationsDto } from './dto/update-column-automations.dto';

/** Legacy singular board routes — default/first board + column mutations. */
@Controller('workspaces/:workspaceId/board')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(BOARD_GET_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async getBoard(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const board = await this.boardsService.getBoard(workspaceId, user.id);
    return successResponse(board);
  }

  @Post('columns')
  @Roles(...MEMBER_PLUS_ROLES)
  async createColumn(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateColumnDto,
  ) {
    const column = await this.boardsService.createColumn(workspaceId, user.id, dto);
    return successResponse(column);
  }

  @Patch('columns/:columnId')
  @Roles(...MEMBER_PLUS_ROLES)
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
  @Roles(...ALL_WORKSPACE_ROLES)
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
  @Roles(...ADMIN_PLUS_ROLES)
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
  @Roles(...MEMBER_PLUS_ROLES)
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
  @Roles(...ADMIN_PLUS_ROLES)
  async deleteColumn(
    @Param('workspaceId') workspaceId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.boardsService.deleteColumn(workspaceId, columnId, user.id);
    return successResponse(result);
  }
}

/** Multi-board routes under `/boards`. */
@Controller('workspaces/:workspaceId/boards')
export class WorkspaceBoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get('templates')
  @Roles(...ALL_WORKSPACE_ROLES)
  async listTemplates() {
    const { BOARD_TEMPLATES } = await import('./templates/board-templates');
    return successResponse(BOARD_TEMPLATES);
  }

  @Get()
  @Roles(...ALL_WORKSPACE_ROLES)
  async listBoards(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const boards = await this.boardsService.listBoards(workspaceId, user.id);
    return successResponse(boards);
  }

  @Post()
  @Roles(...MEMBER_PLUS_ROLES)
  async createBoard(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBoardDto,
  ) {
    const board = await this.boardsService.createBoard(workspaceId, user.id, dto);
    return successResponse(board);
  }

  @Get(':boardId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(BOARD_GET_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async getBoardById(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const board = await this.boardsService.getBoard(workspaceId, user.id, boardId);
    return successResponse(board);
  }

  @Patch(':boardId')
  @Roles(...MEMBER_PLUS_ROLES)
  async updateBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBoardDto,
  ) {
    const board = await this.boardsService.updateBoard(workspaceId, boardId, user.id, dto);
    return successResponse(board);
  }

  @Delete(':boardId')
  @Roles(...ADMIN_PLUS_ROLES)
  async deleteBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.boardsService.deleteBoard(workspaceId, boardId, user.id);
    return successResponse(result);
  }
}
