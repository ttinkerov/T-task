import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiProviderClient } from './ai-provider.client';
import { RAG_EMBEDDING_DIMENSIONS } from './rag/rag.constants';

vi.mock('./utils/base-url-guard.util', () => ({
  resolveSafeAiEndpoint: vi.fn(async (baseUrl: string) => ({
    baseUrl: baseUrl.replace(/\/+$/, ''),
    pinned: { family: 4, address: '1.2.3.4' },
  })),
  sanitizeProviderErrorMessage: (message: string) => message,
}));

vi.mock('./utils/pinned-https-request.util', () => ({
  pinnedHttpsRequest: vi.fn(),
}));

import { pinnedHttpsRequest } from './utils/pinned-https-request.util';

describe('AiProviderClient.createEmbeddings', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /embeddings and returns ordered vectors', async () => {
    const vector = Array.from({ length: RAG_EMBEDDING_DIMENSIONS }, (_, i) => i * 0.001);
    vi.mocked(pinnedHttpsRequest).mockResolvedValue({
      status: 200,
      text: JSON.stringify({
        model: 'text-embedding-3-small',
        data: [
          { index: 1, embedding: vector.map((v) => v + 1) },
          { index: 0, embedding: vector },
        ],
      }),
    });

    const client = new AiProviderClient();
    const result = await client.createEmbeddings({
      baseUrl: 'https://api.openai.com/v1',
      apiToken: 'sk-test',
      inputs: ['alpha', 'beta'],
    });

    expect(pinnedHttpsRequest).toHaveBeenCalledWith(
      'https://api.openai.com/v1/embeddings',
      expect.anything(),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"input":["alpha","beta"]'),
      }),
    );
    expect(result.embeddings).toHaveLength(2);
    expect(result.embeddings[0]?.[0]).toBe(0);
    expect(result.embeddings[1]?.[0]).toBe(1);
  });

  it('rejects wrong embedding dimensions', async () => {
    vi.mocked(pinnedHttpsRequest).mockResolvedValue({
      status: 200,
      text: JSON.stringify({
        data: [{ index: 0, embedding: [1, 2, 3] }],
      }),
    });

    const client = new AiProviderClient();
    await expect(
      client.createEmbeddings({
        baseUrl: 'https://api.openai.com/v1',
        apiToken: 'sk-test',
        inputs: ['x'],
      }),
    ).rejects.toThrow(/размерность/i);
  });
});
