import { Injectable } from '@nestjs/common';
import { MentionSourceType, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { extractMentionUserIds, sanitizeMentionLabels } from './mention-parser.util';

const MAX_PREVIEW_LENGTH = 240;

type NotificationWriter = {
  notification: {
    findMany: Prisma.TransactionClient['notification']['findMany'];
    createMany: Prisma.TransactionClient['notification']['createMany'];
  };
};

interface MentionNotificationContext {
  workspaceId: string;
  actorId: string;
  taskId: string;
  commentId?: string;
  sourceType: MentionSourceType;
  preview: string;
}

@Injectable()
export class MentionsService {
  constructor(private readonly prisma: PrismaService) {}

  async prepare(workspaceId: string, actorId: string, text: string) {
    const extractedIds = extractMentionUserIds(text);
    if (extractedIds.length === 0) {
      return { text, recipientIds: [] };
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        userId: { in: extractedIds },
      },
      select: {
        userId: true,
        user: { select: { name: true } },
      },
    });
    const namesById = new Map(members.map((member) => [member.userId, member.user.name]));
    const memberIds = new Set(members.map((member) => member.userId));

    return {
      text: sanitizeMentionLabels(text, namesById),
      recipientIds: extractedIds.filter((id) => id !== actorId && memberIds.has(id)),
    };
  }

  async notify(
    writer: NotificationWriter,
    context: MentionNotificationContext,
    recipientIds: string[],
  ) {
    if (recipientIds.length === 0) return;

    let targets = recipientIds;
    if (context.commentId) {
      const existing = await writer.notification.findMany({
        where: {
          commentId: context.commentId,
          recipientId: { in: recipientIds },
        },
        select: { recipientId: true },
      });
      const alreadyNotified = new Set(existing.map((item) => item.recipientId));
      targets = recipientIds.filter((recipientId) => !alreadyNotified.has(recipientId));
      if (targets.length === 0) return;
    }

    const preview = this.toPreview(context.preview);
    await writer.notification.createMany({
      data: targets.map((recipientId) => ({
        workspaceId: context.workspaceId,
        recipientId,
        actorId: context.actorId,
        taskId: context.taskId,
        commentId: context.commentId,
        type: NotificationType.MENTION,
        sourceType: context.sourceType,
        preview,
      })),
    });
  }

  private toPreview(text: string) {
    return text
      .replace(/@\[([^\]\r\n]+)\]\([A-Za-z0-9_-]{20,36}\)/g, '@$1')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_PREVIEW_LENGTH);
  }
}
