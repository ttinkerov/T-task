import {
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { ListTrashQueryDto } from './dto/list-trash-query.dto';
import { TrashService } from './trash.service';
import { TrashEntityType } from './trash.types';

@Controller('workspaces/:workspaceId/trash')
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'trash:list', windowSeconds: 60, maxAttempts: 60 })
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTrashQueryDto,
  ) {
    const result = await this.trashService.list(workspaceId, user.id, query);
    return successResponse(result.items, result.meta);
  }

  @Post(':type/:id/restore')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'trash:restore', windowSeconds: 60, maxAttempts: 30 })
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async restore(
    @Param('workspaceId') workspaceId: string,
    @Param('type', new ParseEnumPipe(TrashEntityType)) type: TrashEntityType,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.trashService.restore(workspaceId, user.id, type, id);
    return successResponse(result);
  }

  @Delete(':type/:id')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ keyPrefix: 'trash:purge', windowSeconds: 60, maxAttempts: 20 })
  @Roles(WorkspaceRole.OWNER)
  async purge(
    @Param('workspaceId') workspaceId: string,
    @Param('type', new ParseEnumPipe(TrashEntityType)) type: TrashEntityType,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.trashService.purge(workspaceId, user.id, type, id);
    return successResponse(result);
  }
}
