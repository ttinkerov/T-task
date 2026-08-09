import { describe, expect, it, vi } from 'vitest';
import { AiService } from './ai.service';
import type { AiChatDto } from './dto/ai-chat.dto';

describe('AiService.chat RAG wiring', () => {
  it('injects CONTEXT and returns citations', async () => {
    const providerClient = {
      chatCompletion: vi.fn().mockResolvedValue({
        content: 'Ответ по факту',
        model: 'gpt-4o-mini',
        usage: null,
      }),
    };
    const ragRetriever = {
      loadTaskFocusContext: vi.fn().mockResolvedValue({ snippets: [], excludeKeys: [] }),
      retrieve: vi.fn().mockResolvedValue([
        {
          key: 'TASK:t1',
          sourceType: 'TASK',
          sourceId: 't1',
          title: 'Secret Project',
          snippet: 'Код доступа RAG-ALPHA-42',
          href: '/dashboard/board?board=b1&task=t1',
          score: 1,
        },
      ]),
      buildContextBlock: vi.fn().mockReturnValue({
        context: '[TASK:t1] Secret Project\nКод доступа RAG-ALPHA-42',
        citations: [
          {
            sourceType: 'TASK',
            sourceId: 't1',
            title: 'Secret Project',
            href: '/dashboard/board?board=b1&task=t1',
          },
        ],
      }),
    };
    const credentials = {
      loadChatCredentials: vi.fn().mockResolvedValue({
        provider: 'OPENAI',
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
        apiToken: 'sk-test',
      }),
    };

    const service = new AiService(
      {
        aiWorkspaceSetting: {
          findUnique: vi.fn().mockResolvedValue({
            provider: 'OPENAI',
            model: 'gpt-4o-mini',
            baseUrl: null,
            tokenCiphertext: 'x',
            tokenIv: 'y',
            tokenAuthTag: 'z',
          }),
        },
      } as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({}) } as never,
      {} as never,
      {
        get: vi.fn((key: string) =>
          key === 'AI_TOKEN_ENC_KEY' ? Buffer.alloc(32).toString('base64') : undefined,
        ),
      } as never,
      providerClient as never,
      {} as never,
      ragRetriever as never,
      {} as never,
      {} as never,
      credentials as never,
    );

    const dto: AiChatDto = {
      mode: 'chat',
      useRag: true,
      messages: [{ role: 'user', content: 'Какой код доступа?' }],
    };

    const result = await service.chat('ws-1', 'user-1', dto);

    expect(credentials.loadChatCredentials).toHaveBeenCalledWith('ws-1');
    expect(ragRetriever.retrieve).toHaveBeenCalled();
    expect(providerClient.chatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('RAG-ALPHA-42'),
          }),
        ]),
      }),
    );
    expect(result.citations?.[0]?.sourceId).toBe('t1');
    expect(result.reply).toContain('Ответ');
  });
});
