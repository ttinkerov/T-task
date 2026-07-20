import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class WatchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, taskId: string, userId: string) {
    await this.assertTask(workspaceId, taskId, userId);
    const watchers = await this.prisma.taskWatcher.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return {
      watching: watchers.some((item) => item.userId === userId),
      watchers: watchers.map((item) => item.user),
    };
  }

  async watch(workspaceId: string, taskId: string, userId: string) {
    await this.assertTask(workspaceId, taskId, userId);
    await this.prisma.taskWatcher.upsert({
      where: { taskId_userId: { taskId, userId } },
      create: { taskId, userId },
      update: {},
    });
    return this.list(workspaceId, taskId, userId);
  }

  async unwatch(workspaceId: string, taskId: string, userId: string) {
    await this.assertTask(workspaceId, taskId, userId);
    await this.prisma.taskWatcher.deleteMany({ where: { taskId, userId } });
    return this.list(workspaceId, taskId, userId);
  }

  /** Notify watchers about an event; skips actor and already-notified recipients. */
  async notifyWatchers(params: {
    workspaceId: string;
    taskId: string;
    actorId: string;
    preview: string;
    commentId?: string;
    skipUserIds?: string[];
  }) {
    const watchers = await this.prisma.taskWatcher.findMany({
      where: { taskId: params.taskId },
      select: { userId: true },
    });
    const skip = new Set([params.actorId, ...(params.skipUserIds ?? [])]);
    const recipientIds = watchers.map((item) => item.userId).filter((id) => !skip.has(id));
    if (!recipientIds.length) return;

    await this.prisma.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        workspaceId: params.workspaceId,
        recipientId,
        actorId: params.actorId,
        taskId: params.taskId,
        commentId: params.commentId ?? null,
        type: NotificationType.WATCH,
        preview: params.preview.slice(0, 280),
      })),
    });
  }

  private async assertTask(workspaceId: string, taskId: string, userId: string) {
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
