import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SavedFilterView, WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { CreateSavedFilterDto } from './dto/create-saved-filter.dto';
import { UpdateSavedFilterDto } from './dto/update-saved-filter.dto';
import { SavedFiltersService } from './saved-filters.service';

const FILTER_MUTATE_RATE_LIMIT = {
  keyPrefix: 'saved-filter:mutate',
  windowSeconds: 60,
  maxAttempts: 40,
};

@Controller('workspaces/:workspaceId/saved-filters')
export class SavedFiltersController {
  constructor(private readonly savedFiltersService: SavedFiltersService) {}

  @Get()
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('view') view?: SavedFilterView,
  ) {
    return successResponse(await this.savedFiltersService.list(workspaceId, user.id, view));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(FILTER_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSavedFilterDto,
  ) {
    return successResponse(await this.savedFiltersService.create(workspaceId, user.id, dto));
  }

  @Patch(':filterId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(FILTER_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('filterId') filterId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSavedFilterDto,
  ) {
    return successResponse(
      await this.savedFiltersService.update(workspaceId, filterId, user.id, dto),
    );
  }

  @Delete(':filterId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(FILTER_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('filterId') filterId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.savedFiltersService.remove(workspaceId, filterId, user.id));
  }
}
