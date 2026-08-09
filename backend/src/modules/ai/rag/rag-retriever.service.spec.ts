import { describe, expect, it, vi } from 'vitest';
import { RagSourceType } from '@prisma/client';
import { RagRetrieverService } from './rag-retriever.service';

describe('RagRetrieverService.buildContextBlock', () => {
  it('caps context and returns citations', () => {
    const service = new RagRetrieverService({} as never, {} as never, {} as never, {} as never);

    const built = service.buildContextBlock(
      [
        {
          key: 'TASK:1',
          sourceType: RagSourceType.TASK,
          sourceId: '1',
          title: 'Alpha',
          snippet: 'fact one',
          href: '/a',
          score: 1,
        },
        {
          key: 'COMMENT:2',
          sourceType: RagSourceType.COMMENT,
          sourceId: '2',
          title: 'Beta',
          snippet: 'fact two',
          href: null,
          score: 0.5,
        },
      ],
      10_000,
    );

    expect(built.context).toContain('fact one');
    expect(built.citations).toHaveLength(2);
    expect(built.citations[0]?.sourceId).toBe('1');
  });
});

describe('RagRetrieverService.retrieve tenant filter', () => {
  it('skips vector search when embeddings unavailable', async () => {
    const similaritySearch = vi.fn().mockResolvedValue([]);
    const lexicalChunkSearch = vi.fn().mockResolvedValue([]);
    const service = new RagRetrieverService(
      {
        task: { findMany: vi.fn().mockResolvedValue([]) },
        comment: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      { similaritySearch, lexicalChunkSearch } as never,
      {} as never,
      { loadEmbeddingCredentials: vi.fn().mockResolvedValue(null) } as never,
    );

    await service.retrieve('ws-1', 'secret fact');
    expect(similaritySearch).not.toHaveBeenCalled();
    expect(lexicalChunkSearch).toHaveBeenCalledWith('ws-1', 'secret fact', expect.any(Number));
  });

  it('uses chunk-level keys and excludes source prefixes', async () => {
    const lexicalChunkSearch = vi.fn().mockResolvedValue([
      {
        id: 'c1',
        workspaceId: 'ws-1',
        sourceType: RagSourceType.TASK,
        sourceId: 't1',
        chunkIndex: 0,
        content: 'Задача: Alpha\n\nsecret fact',
        contentHash: 'h1',
        metadata: { title: 'Alpha', boardId: 'b1', taskId: 't1' },
        score: 0.9,
      },
      {
        id: 'c2',
        workspaceId: 'ws-1',
        sourceType: RagSourceType.TASK,
        sourceId: 't2',
        chunkIndex: 1,
        content: 'Задача: Beta\n\nother fact',
        contentHash: 'h2',
        metadata: { title: 'Beta', boardId: 'b1', taskId: 't2' },
        score: 0.8,
      },
    ]);
    const service = new RagRetrieverService(
      {
        task: { findMany: vi.fn().mockResolvedValue([]) },
        comment: { findMany: vi.fn().mockResolvedValue([]) },
      } as never,
      { similaritySearch: vi.fn(), lexicalChunkSearch } as never,
      {} as never,
      { loadEmbeddingCredentials: vi.fn().mockResolvedValue(null) } as never,
    );

    const result = await service.retrieve('ws-1', 'secret fact', {
      excludeKeys: ['TASK:t1'],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('TASK:t2#1');
  });
});
