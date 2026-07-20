import { Controller, Get, Header, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { ExportService } from './export.service';

@Controller('workspaces/:workspaceId/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('tasks.csv')
  @Roles(...ALL_WORKSPACE_ROLES)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async tasks(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const csv = await this.exportService.tasksCsv(workspaceId, user.id);
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }

  @Get('deals.csv')
  @Roles(...ALL_WORKSPACE_ROLES)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async deals(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const csv = await this.exportService.dealsCsv(workspaceId, user.id);
    res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"');
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }
}
