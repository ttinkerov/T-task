import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { workspaceId, recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          task: { select: { id: true, title: true } },
          actor: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.notification.count({
        where: { workspaceId, recipientId: userId, readAt: null },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        sourceType: item.sourceType,
        preview: item.preview,
        read: item.readAt !== null,
        createdAt: item.createdAt.toISOString(),
        task: item.task,
        actor: item.actor,
      })),
      unreadCount,
    };
  }

  async markRead(workspaceId: string, notificationId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, workspaceId, recipientId: userId },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Уведомление не найдено');
    }

    return { success: true };
  }

  async markAllRead(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const result = await this.prisma.notification.updateMany({
      where: { workspaceId, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true, updated: result.count };
  }
}
