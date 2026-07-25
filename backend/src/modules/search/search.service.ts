import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

function boardTaskHref(boardId: string, taskId: string) {
  return `/dashboard/board?board=${boardId}&task=${taskId}`;
}

function descriptionSnippet(description: string | null, term: string): string | null {
  if (!description) return null;
  const lower = description.toLocaleLowerCase('ru-RU');
  const needle = term.toLocaleLowerCase('ru-RU');
  const index = lower.indexOf(needle);
  if (index < 0) return null;
  const start = Math.max(0, index - 24);
  const end = Math.min(description.length, index + term.length + 40);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < description.length ? '…' : '';
  return `${prefix}${description.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}

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
          description: true,
          column: { select: { boardId: true, name: true } },
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
          task: {
            select: {
              title: true,
              column: { select: { boardId: true } },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      tasks: tasks.map((task) => {
        const titleHit = task.title
          .toLocaleLowerCase('ru-RU')
          .includes(term.toLocaleLowerCase('ru-RU'));
        const snippet = titleHit ? null : descriptionSnippet(task.description, term);
        return {
          id: task.id,
          title: task.title,
          boardId: task.column.boardId,
          columnName: task.column.name,
          matchIn: titleHit ? ('title' as const) : ('description' as const),
          snippet,
          href: boardTaskHref(task.column.boardId, task.id),
        };
      }),
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
        href: boardTaskHref(comment.task.column.boardId, comment.taskId),
      })),
    };
  }
}
