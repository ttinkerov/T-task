import { Injectable, Logger } from '@nestjs/common';
import { RagSourceType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AiCredentialsService } from '../ai-credentials.service';
import { AiProviderClient } from '../ai-provider.client';
import { RagChunkRow, RagChunkStore } from './rag-chunk.store';
import { parseRagChunkMetadata } from './rag-chunk.types';
import {
  maxMarginalRelevance,
  RAG_CANDIDATE_LIMIT,
  RAG_CONTEXT_MAX_CHARS,
  RAG_MIN_VECTOR_SCORE,
  RAG_MMR_LAMBDA,
  RAG_RETRIEVE_TOP_K,
  reciprocalRankFusion,
} from './rag.constants';

export type RagCitation = {
  sourceType: RagSourceType;
  sourceId: string;
  title: string;
  href: string | null;
};

export type RagSnippet = {
  key: string;
  sourceType: RagSourceType;
  sourceId: string;
  title: string;
  snippet: string;
  href: string | null;
  score: number;
};

function chunkKey(sourceType: RagSourceType, sourceId: string, chunkIndex: number): string {
  return `${sourceType}:${sourceId}#${chunkIndex}`;
}

function sourceKey(sourceType: RagSourceType, sourceId: string): string {
  return `${sourceType}:${sourceId}`;
}

function isExcluded(key: string, exclude: Set<string>): boolean {
  if (exclude.has(key)) return true;
  const base = key.split('#')[0]!;
  return exclude.has(base);
}

@Injectable()
export class RagRetrieverService {
  private readonly logger = new Logger(RagRetrieverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: RagChunkStore,
    private readonly providerClient: AiProviderClient,
    private readonly credentials: AiCredentialsService,
  ) {}

  async retrieve(
    workspaceId: string,
    query: string,
    opts?: { topK?: number; excludeKeys?: string[] },
  ): Promise<RagSnippet[]> {
    const term = query.trim();
    if (!term) return [];

    const topK = opts?.topK ?? RAG_RETRIEVE_TOP_K;
    const candidateLimit = Math.max(topK * 4, RAG_CANDIDATE_LIMIT);
    const exclude = new Set(opts?.excludeKeys ?? []);

    const [vectorHits, lexicalHits] = await Promise.all([
      this.vectorSearch(workspaceId, term, candidateLimit),
      this.lexicalSearch(workspaceId, term, candidateLimit),
    ]);

    const byKey = new Map<string, RagSnippet>();
    for (const hit of [...vectorHits, ...lexicalHits]) {
      if (isExcluded(hit.key, exclude)) continue;
      const prev = byKey.get(hit.key);
      if (!prev || hit.score > prev.score) {
        byKey.set(hit.key, hit);
      }
    }

    const fused = reciprocalRankFusion([
      vectorHits.filter((h) => !isExcluded(h.key, exclude)).map((h) => h.key),
      lexicalHits.filter((h) => !isExcluded(h.key, exclude)).map((h) => h.key),
    ]);

    const ranked: RagSnippet[] = [];
    for (const item of fused) {
      const snippet = byKey.get(item.id);
      if (!snippet) continue;
      ranked.push({ ...snippet, score: item.score });
    }

    const diversified = maxMarginalRelevance(ranked, topK, RAG_MMR_LAMBDA);

    this.logger.debug(
      `RAG retrieve ws=${workspaceId} vector=${vectorHits.length} lexical=${lexicalHits.length} fused=${ranked.length} top=${diversified.length}`,
    );

    return diversified;
  }

  buildContextBlock(
    snippets: RagSnippet[],
    maxChars = RAG_CONTEXT_MAX_CHARS,
  ): {
    context: string;
    citations: RagCitation[];
  } {
    const lines: string[] = [];
    const citations: RagCitation[] = [];
    const seenSources = new Set<string>();
    let used = 0;

    for (const snippet of snippets) {
      const citationRef = sourceKey(snippet.sourceType, snippet.sourceId);
      const header = `[${citationRef}] ${snippet.title}`;
      const block = `${header}\n${snippet.snippet}`.trim();
      if (used + block.length + 2 > maxChars) break;
      lines.push(block);
      used += block.length + 2;
      if (!seenSources.has(citationRef)) {
        seenSources.add(citationRef);
        citations.push({
          sourceType: snippet.sourceType,
          sourceId: snippet.sourceId,
          title: snippet.title,
          href: snippet.href,
        });
      }
    }

    return {
      context: lines.join('\n\n'),
      citations,
    };
  }

  async loadTaskFocusContext(
    workspaceId: string,
    taskId: string,
  ): Promise<{ snippets: RagSnippet[]; excludeKeys: string[] }> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: {
        id: true,
        title: true,
        description: true,
        column: { select: { boardId: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: { id: true, body: true },
        },
      },
    });

    if (!task) return { snippets: [], excludeKeys: [] };

    const snippets: RagSnippet[] = [
      {
        key: sourceKey(RagSourceType.TASK, task.id),
        sourceType: RagSourceType.TASK,
        sourceId: task.id,
        title: task.title,
        snippet: [task.title, task.description?.trim()].filter(Boolean).join('\n'),
        href: `/dashboard/board?board=${task.column.boardId}&task=${task.id}`,
        score: 1,
      },
    ];

    for (const comment of task.comments) {
      snippets.push({
        key: sourceKey(RagSourceType.COMMENT, comment.id),
        sourceType: RagSourceType.COMMENT,
        sourceId: comment.id,
        title: `Комментарий · ${task.title}`,
        snippet: comment.body.slice(0, 1200),
        href: `/dashboard/board?board=${task.column.boardId}&task=${task.id}`,
        score: 0.9,
      });
    }

    return {
      snippets,
      excludeKeys: snippets.map((s) => s.key),
    };
  }

  private rowToSnippet(row: RagChunkRow): RagSnippet {
    const meta = parseRagChunkMetadata(row.metadata);
    const title = meta?.title ?? `${row.sourceType} ${row.sourceId}`;
    const boardId = meta?.boardId ?? null;
    const taskId = meta?.taskId ?? (row.sourceType === RagSourceType.TASK ? row.sourceId : null);
    return {
      key: chunkKey(row.sourceType, row.sourceId, row.chunkIndex),
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      title,
      snippet: row.content.slice(0, 1200),
      href: boardId && taskId ? `/dashboard/board?board=${boardId}&task=${taskId}` : null,
      score: row.score,
    };
  }

  private async vectorSearch(
    workspaceId: string,
    query: string,
    limit: number,
  ): Promise<RagSnippet[]> {
    const credentials = await this.tryLoadCredentials(workspaceId);
    if (!credentials) return [];

    try {
      const embedded = await this.providerClient.createEmbeddings({
        baseUrl: credentials.baseUrl,
        apiToken: credentials.apiToken,
        model: credentials.embeddingModel,
        inputs: [query],
      });
      const vector = embedded.embeddings[0];
      if (!vector) return [];

      const rows = await this.store.similaritySearch(
        workspaceId,
        vector,
        limit,
        RAG_MIN_VECTOR_SCORE,
      );
      return rows.map((row) => this.rowToSnippet(row));
    } catch (error) {
      this.logger.warn(
        `Vector search skipped: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return [];
    }
  }

  private async lexicalSearch(
    workspaceId: string,
    term: string,
    limit: number,
  ): Promise<RagSnippet[]> {
    try {
      const rows = await this.store.lexicalChunkSearch(workspaceId, term, limit);
      if (rows.length > 0) {
        return rows.map((row) => this.rowToSnippet(row));
      }
    } catch (error) {
      this.logger.warn(
        `Chunk lexical search skipped: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }

    return this.entityLexicalSearch(workspaceId, term, limit);
  }

  private async entityLexicalSearch(
    workspaceId: string,
    term: string,
    limit: number,
  ): Promise<RagSnippet[]> {
    const tokens = term
      .toLocaleLowerCase('ru-RU')
      .split(/[^\p{L}\p{N}]+/u)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
      .slice(0, 6);

    const terms = tokens.length > 0 ? tokens : [term.slice(0, 200)];

    const [tasks, comments] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          deletedAt: null,
          column: { board: { workspaceId } },
          OR: terms.flatMap((t) => [
            { title: { contains: t, mode: 'insensitive' as const } },
            { description: { contains: t, mode: 'insensitive' as const } },
          ]),
        },
        select: {
          id: true,
          title: true,
          description: true,
          column: { select: { boardId: true } },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.comment.findMany({
        where: {
          OR: terms.map((t) => ({ body: { contains: t, mode: 'insensitive' as const } })),
          task: { deletedAt: null, column: { board: { workspaceId } } },
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

    const taskSnippets: RagSnippet[] = tasks.map((task, index) => ({
      key: chunkKey(RagSourceType.TASK, task.id, 0),
      sourceType: RagSourceType.TASK,
      sourceId: task.id,
      title: task.title,
      snippet: [task.title, task.description?.trim()].filter(Boolean).join('\n').slice(0, 1200),
      href: `/dashboard/board?board=${task.column.boardId}&task=${task.id}`,
      score: 1 / (index + 1),
    }));

    const commentSnippets: RagSnippet[] = comments.map((comment, index) => ({
      key: chunkKey(RagSourceType.COMMENT, comment.id, 0),
      sourceType: RagSourceType.COMMENT,
      sourceId: comment.id,
      title: `Комментарий · ${comment.task.title}`,
      snippet: comment.body.slice(0, 1200),
      href: `/dashboard/board?board=${comment.task.column.boardId}&task=${comment.taskId}`,
      score: 1 / (index + 1),
    }));

    return [...taskSnippets, ...commentSnippets];
  }

  private async tryLoadCredentials(workspaceId: string): Promise<{
    baseUrl: string;
    apiToken: string;
    embeddingModel: string;
  } | null> {
    const creds = await this.credentials.loadEmbeddingCredentials(workspaceId);
    if (!creds) return null;
    return {
      baseUrl: creds.baseUrl,
      apiToken: creds.apiToken,
      embeddingModel: creds.model,
    };
  }
}
