import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit, SEARCH_RATE_LIMIT } from '../../common/security/rate-limit.decorator';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@Controller('workspaces/:workspaceId/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(SEARCH_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async search(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchQueryDto,
  ) {
    return successResponse(
      await this.searchService.search(workspaceId, user.id, query.q, query.limit),
    );
  }
}
