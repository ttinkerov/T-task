import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async search(workspaceId: string, userId: string, q: string, limit: number) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const term = q.trim();
    if (!term) {
      return { tasks: [], deals: [], comments: [] };
    }

    const [tasks, deals, comments] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          deletedAt: null,
          column: { board: { workspaceId } },
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          column: { select: { boardId: true } },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.deal.findMany({
        where: {
          deletedAt: null,
          stage: { funnel: { workspaceId } },
          title: { contains: term, mode: 'insensitive' },
        },
        select: {
          id: true,
          title: true,
          stage: { select: { funnelId: true } },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.comment.findMany({
        where: {
          body: { contains: term, mode: 'insensitive' },
          task: {
            deletedAt: null,
            column: { board: { workspaceId } },
          },
        },
        select: {
          id: true,
          body: true,
          taskId: true,
          task: { select: { title: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        boardId: task.column.boardId,
        href: `/dashboard/boards?board=${task.column.boardId}&task=${task.id}`,
      })),
      deals: deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        funnelId: deal.stage.funnelId,
        href: `/dashboard/crm?deal=${deal.id}`,
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        preview: comment.body.slice(0, 120),
        taskId: comment.taskId,
        taskTitle: comment.task.title,
        href: `/dashboard/boards?task=${comment.taskId}`,
      })),
    };
  }
}
