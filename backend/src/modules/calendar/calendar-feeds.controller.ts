import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Public } from '../../common/auth/decorators/public.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  CALENDAR_FEED_GET_RATE_LIMIT,
  CALENDAR_FEED_MANAGE_RATE_LIMIT,
  RateLimit,
} from '../../common/security/rate-limit.decorator';
import { CalendarFeedsService } from './calendar-feeds.service';

@Controller('workspaces/:workspaceId/calendar-feed')
@UseGuards(AuthRateLimitGuard)
@RateLimit(CALENDAR_FEED_MANAGE_RATE_LIMIT)
export class CalendarFeedsController {
  constructor(private readonly calendarFeedsService: CalendarFeedsService) {}

  @Get()
  @RateLimit(CALENDAR_FEED_GET_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async getStatus(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.calendarFeedsService.getStatus(workspaceId, user.id));
  }

  @Post()
  @Roles(...ALL_WORKSPACE_ROLES)
  async createOrRotate(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.calendarFeedsService.createOrRotate(workspaceId, user.id));
  }

  @Delete()
  @Roles(...ALL_WORKSPACE_ROLES)
  async revoke(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.calendarFeedsService.revoke(workspaceId, user.id));
  }
}

@Controller('calendar/feeds')
@Public()
export class PublicCalendarFeedsController {
  constructor(private readonly calendarFeedsService: CalendarFeedsService) {}

  @Get(':token/calendar.ics')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(CALENDAR_FEED_GET_RATE_LIMIT)
  async getCalendar(
    @Param('token') token: string,
    @Req() request: Request,

    @Res() response: Response,
  ): Promise<void> {
    const calendar = await this.calendarFeedsService.getCalendar(token);
    const ifModifiedSince = request.headers['if-modified-since'];
    const clientModifiedAt = ifModifiedSince ? new Date(ifModifiedSince) : null;
    const isNotModified =
      clientModifiedAt &&
      !Number.isNaN(clientModifiedAt.getTime()) &&
      Math.floor(calendar.lastModified.getTime() / 1000) <=
        Math.floor(clientModifiedAt.getTime() / 1000);

    if (isNotModified) {
      response.status(HttpStatus.NOT_MODIFIED).end();
      return;
    }

    response
      .status(HttpStatus.OK)
      .set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="t-task.ics"',
        'Cache-Control': 'private, no-cache, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Last-Modified': calendar.lastModified.toUTCString(),
        'X-Robots-Tag': 'noindex, nofollow',
      })
      .send(calendar.content);
  }
}
