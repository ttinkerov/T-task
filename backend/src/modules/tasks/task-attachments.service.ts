import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

@Injectable()
export class TaskAttachmentsService {
  private readonly uploadRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly configService: ConfigService,
  ) {
    this.uploadRoot =
      this.configService.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
  }

  async list(workspaceId: string, taskId: string, userId: string) {
    await this.requireTask(workspaceId, taskId, userId);
    const items = await this.prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.serialize(item));
  }

  async upload(workspaceId: string, taskId: string, userId: string, file: Express.Multer.File) {
    await this.requireTask(workspaceId, taskId, userId);
    this.assertFile(file);

    const safeName = file.originalname.replace(/[^\w.\-()\sа-яА-ЯёЁ]/g, '_').slice(0, 120);
    const storageName = `${randomUUID()}-${createHash('sha1').update(safeName).digest('hex').slice(0, 8)}`;
    const dir = join(this.uploadRoot, workspaceId, taskId);
    await mkdir(dir, { recursive: true });
    const storagePath = join(dir, storageName);
    await writeFile(storagePath, file.buffer);

    const created = await this.prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedById: userId,
        originalName: safeName || 'file',
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath,
      },
    });

    return this.serialize(created);
  }

  async getFile(workspaceId: string, taskId: string, attachmentId: string, userId: string) {
    await this.requireTask(workspaceId, taskId, userId);
    const attachment = await this.prisma.taskAttachment.findFirst({
      where: { id: attachmentId, taskId },
    });
    if (!attachment) throw new NotFoundException('Файл не найден');
    return attachment;
  }

  async remove(workspaceId: string, taskId: string, attachmentId: string, userId: string) {
    await this.requireTask(workspaceId, taskId, userId);
    const attachment = await this.prisma.taskAttachment.findFirst({
      where: { id: attachmentId, taskId },
    });
    if (!attachment) throw new NotFoundException('Файл не найден');

    await this.prisma.taskAttachment.delete({ where: { id: attachmentId } });
    try {
      await unlink(attachment.storagePath);
    } catch {
      // file may already be gone
    }
    return { deleted: true };
  }

  private serialize(item: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: Date;
  }) {
    return {
      id: item.id,
      originalName: item.originalName,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      createdAt: item.createdAt.toISOString(),
      isImage: item.mimeType.startsWith('image/'),
      isPdf: item.mimeType === 'application/pdf',
    };
  }

  private assertFile(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл обязателен');
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('Размер файла должен быть до 5 МБ');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Допустимы изображения, PDF и текстовые файлы');
    }
  }

  private async requireTask(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    return task;
  }
}
