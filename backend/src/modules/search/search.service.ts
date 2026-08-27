import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { likeContainsPattern } from '../../common/sql/like-pattern.util';
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
  if (index < 0) {
    const words = term.split(/\s+/).filter(Boolean);
    for (const word of words) {
      const wordIndex = lower.indexOf(word.toLocaleLowerCase('ru-RU'));
      if (wordIndex >= 0) {
        const start = Math.max(0, wordIndex - 24);
        const end = Math.min(description.length, wordIndex + word.length + 40);
        const prefix = start > 0 ? '…' : '';
        const suffix = end < description.length ? '…' : '';
        return `${prefix}${description.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
      }
    }
    return null;
  }
  const start = Math.max(0, index - 24);
  const end = Math.min(description.length, index + term.length + 40);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < description.length ? '…' : '';
  return `${prefix}${description.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}

type TaskSearchRow = {
  id: string;
  title: string;
  description: string | null;
  board_id: string;
  column_name: string;
  rank: number;
};

type DealSearchRow = {
  id: string;
  title: string;
  funnel_id: string;
  rank: number;
};

type CommentSearchRow = {
  id: string;
  body: string;
  task_id: string;
  task_title: string;
  board_id: string;
  rank: number;
};

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

    const like = likeContainsPattern(term);
    const [tasks, deals, comments] = await Promise.all([
      this.prisma.$queryRaw<TaskSearchRow[]>(Prisma.sql`
        SELECT
          t.id,
          t.title,
          t.description,
          c.board_id,
          c.name AS column_name,
          GREATEST(
            similarity(t.title, ${term}),
            similarity(coalesce(t.description, ''), ${term}),
            CASE
              WHEN to_tsvector('russian', coalesce(t.title, '') || ' ' || coalesce(t.description, ''))
                   @@ plainto_tsquery('russian', ${term})
              THEN 0.5
              ELSE 0
            END
          ) AS rank
        FROM tasks t
        INNER JOIN board_columns c ON c.id = t.column_id
        INNER JOIN boards b ON b.id = c.board_id
        WHERE b.workspace_id = ${workspaceId}
          AND t.deleted_at IS NULL
          AND (
            t.title ILIKE ${like} ESCAPE '\\'
            OR coalesce(t.description, '') ILIKE ${like} ESCAPE '\\'
            OR to_tsvector('russian', coalesce(t.title, '') || ' ' || coalesce(t.description, ''))
                @@ plainto_tsquery('russian', ${term})
            OR similarity(t.title, ${term}) > 0.2
            OR similarity(coalesce(t.description, ''), ${term}) > 0.2
          )
        ORDER BY rank DESC, t.updated_at DESC
        LIMIT ${limit}
      `),
      this.prisma.$queryRaw<DealSearchRow[]>(Prisma.sql`
        SELECT
          d.id,
          d.title,
          f.id AS funnel_id,
          GREATEST(
            similarity(d.title, ${term}),
            CASE
              WHEN to_tsvector('russian', coalesce(d.title, '')) @@ plainto_tsquery('russian', ${term})
              THEN 0.5
              ELSE 0
            END
          ) AS rank
        FROM deals d
        INNER JOIN funnel_stages s ON s.id = d.stage_id
        INNER JOIN funnels f ON f.id = s.funnel_id
        WHERE f.workspace_id = ${workspaceId}
          AND d.deleted_at IS NULL
          AND (
            d.title ILIKE ${like} ESCAPE '\\'
            OR to_tsvector('russian', coalesce(d.title, '')) @@ plainto_tsquery('russian', ${term})
            OR similarity(d.title, ${term}) > 0.2
          )
        ORDER BY rank DESC, d.updated_at DESC
        LIMIT ${limit}
      `),
      this.prisma.$queryRaw<CommentSearchRow[]>(Prisma.sql`
        SELECT
          cm.id,
          cm.body,
          cm.task_id,
          t.title AS task_title,
          c.board_id,
          GREATEST(
            similarity(cm.body, ${term}),
            CASE
              WHEN to_tsvector('russian', coalesce(cm.body, '')) @@ plainto_tsquery('russian', ${term})
              THEN 0.5
              ELSE 0
            END
          ) AS rank
        FROM comments cm
        INNER JOIN tasks t ON t.id = cm.task_id
        INNER JOIN board_columns c ON c.id = t.column_id
        INNER JOIN boards b ON b.id = c.board_id
        WHERE b.workspace_id = ${workspaceId}
          AND t.deleted_at IS NULL
          AND (
            cm.body ILIKE ${like} ESCAPE '\\'
            OR to_tsvector('russian', coalesce(cm.body, '')) @@ plainto_tsquery('russian', ${term})
            OR similarity(cm.body, ${term}) > 0.2
          )
        ORDER BY rank DESC, cm.created_at DESC
        LIMIT ${limit}
      `),
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
          boardId: task.board_id,
          columnName: task.column_name,
          matchIn: titleHit ? ('title' as const) : ('description' as const),
          snippet,
          href: boardTaskHref(task.board_id, task.id),
        };
      }),
      deals: deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        funnelId: deal.funnel_id,
        href: `/dashboard/crm?deal=${deal.id}`,
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        preview: comment.body.slice(0, 120),
        taskId: comment.task_id,
        taskTitle: comment.task_title,
        href: boardTaskHref(comment.board_id, comment.task_id),
      })),
    };
  }
}
