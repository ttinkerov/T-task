import { Injectable, Logger } from '@nestjs/common';
import { RagSourceType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AiCredentialsService } from '../ai-credentials.service';
import { AiProviderClient } from '../ai-provider.client';
import { createId } from './create-id';
import { RagChunkStore } from './rag-chunk.store';
import { RAG_EMBED_BATCH_SIZE, sha256Hex } from './rag.constants';
import {
  chunkText,
  commentToPlainText,
  contextualizeChunk,
  taskToPlainText,
} from './rag-text.util';

@Injectable()
export class RagIndexerService {
  private readonly logger = new Logger(RagIndexerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: RagChunkStore,
    private readonly providerClient: AiProviderClient,
    private readonly credentials: AiCredentialsService,
  ) {}

  scheduleUpsertTask(workspaceId: string, taskId: string) {
    this.defer(() => this.upsertTask(workspaceId, taskId));
  }

  scheduleUpsertComment(workspaceId: string, commentId: string) {
    this.defer(() => this.upsertComment(workspaceId, commentId));
  }

  scheduleDeleteSource(workspaceId: string, sourceType: RagSourceType, sourceId: string) {
    this.defer(() => this.deleteSource(workspaceId, sourceType, sourceId));
  }

  scheduleSoftDeleteTask(workspaceId: string, taskId: string) {
    this.defer(() => this.softDeleteTask(workspaceId, taskId));
  }

  async upsertTask(workspaceId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        column: { board: { workspaceId } },
      },
      select: {
        id: true,
        title: true,
        description: true,
        descriptionDoc: true,
        deletedAt: true,
        column: { select: { boardId: true } },
      },
    });

    if (!task || task.deletedAt) {
      await this.softDeleteTask(workspaceId, taskId);
      return;
    }

    const plain = taskToPlainText({
      title: task.title,
      description: task.description,
      descriptionDoc: task.descriptionDoc,
    });

    await this.replaceSourceChunks({
      workspaceId,
      sourceType: RagSourceType.TASK,
      sourceId: task.id,
      plain,
      title: task.title,
      metadata: {
        taskId: task.id,
        boardId: task.column.boardId,
        title: task.title,
      },
    });
  }

  async upsertComment(workspaceId: string, commentId: string): Promise<void> {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        task: { column: { board: { workspaceId } } },
      },
      select: {
        id: true,
        body: true,
        taskId: true,
        task: {
          select: {
            title: true,
            deletedAt: true,
            column: { select: { boardId: true } },
          },
        },
      },
    });

    if (!comment || comment.task.deletedAt) {
      await this.store.deleteSource(workspaceId, RagSourceType.COMMENT, commentId);
      return;
    }

    const plain = commentToPlainText({
      body: comment.body,
      taskTitle: comment.task.title,
    });

    await this.replaceSourceChunks({
      workspaceId,
      sourceType: RagSourceType.COMMENT,
      sourceId: comment.id,
      plain,
      title: comment.task.title,
      metadata: {
        commentId: comment.id,
        taskId: comment.taskId,
        boardId: comment.task.column.boardId,
        title: comment.task.title,
      },
    });
  }

  async deleteSource(workspaceId: string, sourceType: RagSourceType, sourceId: string) {
    await this.store.deleteSource(workspaceId, sourceType, sourceId);
  }

  async softDeleteTask(workspaceId: string, taskId: string) {
    await this.store.deleteSource(workspaceId, RagSourceType.TASK, taskId);
    await this.store.deleteCommentsForTask(workspaceId, taskId);
  }

  async reindexWorkspace(workspaceId: string): Promise<{ tasks: number; comments: number }> {
    await this.store.wipeWorkspace(workspaceId);

    const tasks = await this.prisma.task.findMany({
      where: { deletedAt: null, column: { board: { workspaceId } } },
      select: { id: true },
    });
    const comments = await this.prisma.comment.findMany({
      where: {
        task: { deletedAt: null, column: { board: { workspaceId } } },
      },
      select: { id: true },
    });

    for (const task of tasks) {
      await this.upsertTask(workspaceId, task.id);
    }
    for (const comment of comments) {
      await this.upsertComment(workspaceId, comment.id);
    }

    return { tasks: tasks.length, comments: comments.length };
  }

  private async replaceSourceChunks(input: {
    workspaceId: string;
    sourceType: RagSourceType;
    sourceId: string;
    plain: string;
    title: string;
    metadata: Record<string, unknown>;
  }) {
    const rawChunks = chunkText(input.plain);
    const chunks = rawChunks.map((chunk) =>
      contextualizeChunk({
        sourceType: input.sourceType === RagSourceType.TASK ? 'TASK' : 'COMMENT',
        title: input.title,
        chunk,
      }),
    );
    if (chunks.length === 0) {
      await this.store.deleteSource(input.workspaceId, input.sourceType, input.sourceId);
      return;
    }

    const credentials = await this.tryLoadCredentials(input.workspaceId);
    if (!credentials) {
      this.logger.debug(`Skip RAG index: AI not configured for ${input.workspaceId}`);
      return;
    }

    const existing = await this.store.listExisting(
      input.workspaceId,
      input.sourceType,
      input.sourceId,
    );
    const existingByIndex = new Map(existing.map((row) => [row.chunkIndex, row]));

    const toEmbed: Array<{ chunkIndex: number; content: string; contentHash: string }> = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const content = chunks[i]!;
      const contentHash = sha256Hex(content);
      const prev = existingByIndex.get(i);
      if (!prev || prev.contentHash !== contentHash) {
        toEmbed.push({ chunkIndex: i, content, contentHash });
      }
    }

    const staleIds = existing.filter((row) => row.chunkIndex >= chunks.length).map((row) => row.id);
    if (staleIds.length > 0) {
      await this.store.deleteByIds(staleIds);
    }

    for (let offset = 0; offset < toEmbed.length; offset += RAG_EMBED_BATCH_SIZE) {
      const batch = toEmbed.slice(offset, offset + RAG_EMBED_BATCH_SIZE);
      let embeddings: number[][];
      try {
        const result = await this.providerClient.createEmbeddings({
          baseUrl: credentials.baseUrl,
          apiToken: credentials.apiToken,
          model: credentials.embeddingModel,
          inputs: batch.map((item) => item.content),
        });
        embeddings = result.embeddings;
      } catch (error) {
        this.logger.warn(
          `Embeddings failed for ${input.sourceType}:${input.sourceId}: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
        return;
      }

      for (let i = 0; i < batch.length; i += 1) {
        const item = batch[i]!;
        const embedding = embeddings[i];
        if (!embedding) continue;
        const prev = existingByIndex.get(item.chunkIndex);
        await this.store.upsertChunk({
          id: prev?.id ?? createId(),
          workspaceId: input.workspaceId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          chunkIndex: item.chunkIndex,
          content: item.content,
          contentHash: item.contentHash,
          embedding,
          metadata: input.metadata,
        });
      }
    }
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

  private defer(work: () => Promise<void>) {
    setImmediate(() => {
      void work().catch((error: unknown) => {
        this.logger.warn(
          `RAG index job failed: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      });
    });
  }
}
