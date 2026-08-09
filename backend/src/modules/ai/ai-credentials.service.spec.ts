import { describe, expect, it, vi } from 'vitest';
import { AiProvider } from '@prisma/client';
import { AiCredentialsService } from './ai-credentials.service';

describe('AiCredentialsService.loadEmbeddingCredentials', () => {
  it('uses dedicated embedding credentials when set', async () => {
    const service = new AiCredentialsService(
      {
        aiWorkspaceSetting: {
          findUnique: vi.fn().mockResolvedValue({
            provider: AiProvider.CUSTOM,
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            tokenCiphertext: 'chat',
            tokenIv: 'iv',
            tokenAuthTag: 'tag',
            embeddingProvider: AiProvider.OPENAI,
            embeddingBaseUrl: null,
            embeddingModel: 'text-embedding-3-small',
            embeddingTokenCiphertext: 'emb',
            embeddingTokenIv: 'eiv',
            embeddingTokenAuthTag: 'etag',
          }),
        },
      } as never,
      {
        get: vi.fn((key: string) =>
          key === 'AI_TOKEN_ENC_KEY' ? Buffer.alloc(32).toString('base64') : undefined,
        ),
      } as never,
    );

    vi.spyOn(service as never, 'toRuntime' as never).mockImplementation(((input: {
      provider: AiProvider;
      model: string;
    }) => ({
      provider: input.provider,
      model: input.model,
      baseUrl: 'https://api.openai.com/v1',
      apiToken: 'sk-emb',
    })) as never);

    const creds = await service.loadEmbeddingCredentials('ws-1');
    expect(creds?.provider).toBe(AiProvider.OPENAI);
    expect(creds?.model).toBe('text-embedding-3-small');
  });

  it('returns null for DeepSeek chat without dedicated embeddings', async () => {
    const service = new AiCredentialsService(
      {
        aiWorkspaceSetting: {
          findUnique: vi.fn().mockResolvedValue({
            provider: AiProvider.CUSTOM,
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            tokenCiphertext: 'chat',
            tokenIv: 'iv',
            tokenAuthTag: 'tag',
            embeddingProvider: null,
            embeddingTokenCiphertext: null,
          }),
        },
      } as never,
      { get: vi.fn(() => Buffer.alloc(32).toString('base64')) } as never,
    );

    await expect(service.loadEmbeddingCredentials('ws-1')).resolves.toBeNull();
  });
});
