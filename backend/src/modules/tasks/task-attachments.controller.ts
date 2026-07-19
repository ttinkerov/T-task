import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkspaceRole } from '@prisma/client';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { TaskAttachmentsService } from './task-attachments.service';

const ATTACHMENT_MUTATE_RATE_LIMIT = {
  keyPrefix: 'task-attachment:mutate',
  windowSeconds: 60,
  maxAttempts: 30,
};

@Controller('workspaces/:workspaceId/tasks/:taskId/attachments')
export class TaskAttachmentsController {
  constructor(private readonly attachmentsService: TaskAttachmentsService) {}

  @Get()
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(await this.attachmentsService.list(workspaceId, taskId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(ATTACHMENT_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return successResponse(
      await this.attachmentsService.upload(workspaceId, taskId, user.id, file),
    );
  }

  @Get(':attachmentId/content')
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async content(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const file = await this.attachmentsService.getFile(workspaceId, taskId, attachmentId, user.id);
    res.setHeader('Content-Type', file.mimeType);
    // Only images are shown inline; PDFs and plain-text files are forced to download
    // so embedded PDF-JavaScript or MIME-confusion tricks cannot run in-browser.
    const disposition = file.mimeType.startsWith('image/') ? 'inline' : 'attachment';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    const stream = createReadStream(file.storagePath);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
    });
    stream.pipe(res);
  }

  @Delete(':attachmentId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(ATTACHMENT_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.attachmentsService.remove(workspaceId, taskId, attachmentId, user.id),
    );
  }
}
