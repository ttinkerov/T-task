import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MentionSourceType, Prisma } from '@prisma/client';
import { DomainEvents } from '../../common/events/domain-events';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MentionsService } from '../mentions/mentions.service';
import { WatchersService } from '../watchers/watchers.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly mentionsService: MentionsService,
    private readonly watchersService: WatchersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async list(workspaceId: string, taskId: string, userId: string) {
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return comments.reverse().map((comment) => this.toComment(comment));
  }

  async create(workspaceId: string, taskId: string, userId: string, dto: CreateCommentDto) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);
    const prepared = await this.mentionsService.prepare(workspaceId, userId, dto.body.trim());

    const comment = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.comment.create({
        data: {
          taskId,
          authorId: userId,
          body: prepared.text,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      await this.mentionsService.notify(
        tx,
        {
          workspaceId,
          actorId: userId,
          taskId,
          commentId: created.id,
          sourceType: MentionSourceType.COMMENT,
          preview: prepared.text,
        },
        prepared.recipientIds,
      );

      return created;
    });

    await this.watchersService.notifyWatchers({
      workspaceId,
      taskId,
      actorId: userId,
      commentId: comment.id,
      preview: `Комментарий: ${prepared.text}`,
      skipUserIds: prepared.recipientIds,
    });

    this.eventEmitter.emit(DomainEvents.COMMENT_CREATED, {
      workspaceId,
      boardId: task.column.boardId,
      taskId,
      commentId: comment.id,
      actorId: userId,
    });

    return this.toComment(comment);
  }

  async remove(workspaceId: string, taskId: string, commentId: string, userId: string) {
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      const membership = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      });
      const canModerate = membership?.role === 'OWNER' || membership?.role === 'ADMIN';
      if (!canModerate) {
        throw new NotFoundException('Comment not found');
      }
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    this.eventEmitter.emit(DomainEvents.COMMENT_DELETED, {
      workspaceId,
      commentId,
    });

    return { success: true };
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: {
        id: true,
        column: { select: { boardId: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private toComment(comment: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    author: { id: string; name: string; email: string; avatarUrl: string | null };
  }) {
    return {
      id: comment.id,
      body: comment.body,
      authorId: comment.authorId,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
