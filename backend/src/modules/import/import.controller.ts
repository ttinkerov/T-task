import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { IMPORT_RATE_LIMIT, RateLimit } from '../../common/security/rate-limit.decorator';
import { ImportTasksDto } from './dto/import-tasks.dto';
import { ImportService } from './import.service';

@Controller('workspaces/:workspaceId/import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('tasks')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(IMPORT_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async importTasks(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ImportTasksDto,
  ) {
    return successResponse(await this.importService.importTasks(workspaceId, user.id, dto));
  }
}
