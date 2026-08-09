import { Injectable, Logger } from '@nestjs/common';
import { Prisma, RagSourceType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { RagChunkMetadata } from './rag-chunk.types';
import { formatVectorLiteral } from './rag.constants';

export type RagChunkRow = {
  id: string;
  workspaceId: string;
  sourceType: RagSourceType;
  sourceId: string;
  chunkIndex: number;
  content: string;
  contentHash: string;
  metadata: Prisma.JsonValue;
  score: number;
};

type ExistingChunk = {
  id: string;
  chunkIndex: number;
  contentHash: string;
};

@Injectable()
export class RagChunkStore {
  private readonly logger = new Logger(RagChunkStore.name);

  constructor(private readonly prisma: PrismaService) {}

  async listExisting(
    workspaceId: string,
    sourceType: RagSourceType,
    sourceId: string,
  ): Promise<ExistingChunk[]> {
    return this.prisma.ragChunk.findMany({
      where: { workspaceId, sourceType, sourceId },
      select: { id: true, chunkIndex: true, contentHash: true },
      orderBy: { chunkIndex: 'asc' },
    });
  }

  async deleteSource(workspaceId: string, sourceType: RagSourceType, sourceId: string) {
    await this.prisma.ragChunk.deleteMany({
      where: { workspaceId, sourceType, sourceId },
    });
  }

  async deleteCommentsForTask(workspaceId: string, taskId: string) {
    await this.prisma.ragChunk.deleteMany({
      where: {
        workspaceId,
        sourceType: RagSourceType.COMMENT,
        metadata: {
          path: ['taskId'],
          equals: taskId,
        },
      },
    });
  }

  async deleteByIds(ids: string[]) {
    if (ids.length === 0) return;
    await this.prisma.ragChunk.deleteMany({ where: { id: { in: ids } } });
  }

  async upsertChunk(input: {
    id: string;
    workspaceId: string;
    sourceType: RagSourceType;
    sourceId: string;
    chunkIndex: number;
    content: string;
    contentHash: string;
    embedding: number[];
    metadata: RagChunkMetadata;
  }) {
    const vector = formatVectorLiteral(input.embedding);
    const vectorSql = Prisma.raw(`'${vector}'::float8[]`);
    const metadataJson = JSON.stringify(input.metadata);
    try {
      await this.prisma.$executeRaw`
        INSERT INTO rag_chunks (
          id, workspace_id, source_type, source_id, chunk_index,
          content, content_hash, embedding, metadata, created_at, updated_at
        ) VALUES (
          ${input.id},
          ${input.workspaceId},
          CAST(${input.sourceType} AS "RagSourceType"),
          ${input.sourceId},
          ${input.chunkIndex},
          ${input.content},
          ${input.contentHash},
          ${vectorSql},
          ${metadataJson}::jsonb,
          NOW(),
          NOW()
        )
        ON CONFLICT (source_type, source_id, chunk_index)
        DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          content = EXCLUDED.content,
          content_hash = EXCLUDED.content_hash,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `;
    } catch (error) {
      this.logger.error(
        `Failed to upsert rag chunk ${input.sourceType}:${input.sourceId}#${input.chunkIndex}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async similaritySearch(
    workspaceId: string,
    queryEmbedding: number[],
    limit: number,
    minScore = 0,
  ): Promise<RagChunkRow[]> {
    const vector = formatVectorLiteral(queryEmbedding);
    const vectorSql = Prisma.raw(`'${vector}'::float8[]`);
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        workspace_id: string;
        source_type: RagSourceType;
        source_id: string;
        chunk_index: number;
        content: string;
        content_hash: string;
        metadata: Prisma.JsonValue;
        score: number;
      }>
    >`
      SELECT * FROM (
        SELECT
          id,
          workspace_id,
          source_type,
          source_id,
          chunk_index,
          content,
          content_hash,
          metadata,
          (
            SELECT CASE
              WHEN norms.norm_a = 0 OR norms.norm_b = 0 THEN 0::float8
              ELSE (norms.dot / (norms.norm_a * norms.norm_b))::float8
            END
            FROM (
              SELECT
                COALESCE(SUM(e * q), 0)::float8 AS dot,
                SQRT(COALESCE(SUM(e * e), 0))::float8 AS norm_a,
                SQRT(COALESCE(SUM(q * q), 0))::float8 AS norm_b
              FROM unnest(rag_chunks.embedding) WITH ORDINALITY AS t(e, i)
              JOIN unnest(${vectorSql}) WITH ORDINALITY AS u(q, j) ON i = j
            ) AS norms
          ) AS score
        FROM rag_chunks
        WHERE workspace_id = ${workspaceId}
      ) ranked
      WHERE score >= ${minScore}
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => this.mapChunkRow(row));
  }

  async lexicalChunkSearch(
    workspaceId: string,
    query: string,
    limit: number,
  ): Promise<RagChunkRow[]> {
    const term = query.trim().slice(0, 500);
    if (!term) return [];
    const escaped = term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const likePattern = `%${escaped}%`;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        workspace_id: string;
        source_type: RagSourceType;
        source_id: string;
        chunk_index: number;
        content: string;
        content_hash: string;
        metadata: Prisma.JsonValue;
        score: number;
      }>
    >`
      SELECT
        id,
        workspace_id,
        source_type,
        source_id,
        chunk_index,
        content,
        content_hash,
        metadata,
        GREATEST(
          similarity(content, ${term}),
          CASE
            WHEN content ILIKE ${likePattern} ESCAPE '\\' THEN 0.55::float8
            ELSE 0::float8
          END
        ) AS score
      FROM rag_chunks
      WHERE workspace_id = ${workspaceId}
        AND (
          content ILIKE ${likePattern} ESCAPE '\\'
          OR content % ${term}
        )
      ORDER BY score DESC, updated_at DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => this.mapChunkRow(row));
  }

  private mapChunkRow(row: {
    id: string;
    workspace_id: string;
    source_type: RagSourceType;
    source_id: string;
    chunk_index: number;
    content: string;
    content_hash: string;
    metadata: Prisma.JsonValue;
    score: number;
  }): RagChunkRow {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      chunkIndex: row.chunk_index,
      content: row.content,
      contentHash: row.content_hash,
      metadata: row.metadata,
      score: row.score,
    };
  }

  async countByWorkspace(workspaceId: string): Promise<number> {
    return this.prisma.ragChunk.count({ where: { workspaceId } });
  }

  async latestUpdatedAt(workspaceId: string): Promise<Date | null> {
    const row = await this.prisma.ragChunk.findFirst({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
    return row?.updatedAt ?? null;
  }

  async wipeWorkspace(workspaceId: string) {
    await this.prisma.ragChunk.deleteMany({ where: { workspaceId } });
  }
}
