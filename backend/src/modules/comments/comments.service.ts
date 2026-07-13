import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, taskId: string, userId: string) {
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return comments.map((comment) => this.toComment(comment));
  }

  async create(workspaceId: string, taskId: string, userId: string, dto: CreateCommentDto) {
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        authorId: userId,
        body: dto.body.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
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
    return { success: true };
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        column: { board: { workspaceId } },
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
