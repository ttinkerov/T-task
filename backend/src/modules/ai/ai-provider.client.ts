import {
  assertSafeAiBaseUrlResolved,
  sanitizeProviderErrorMessage,
} from './utils/base-url-guard.util';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionResult = {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
};

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_COMPLETION_TOKENS = 2048;
const MAX_RESPONSE_BYTES = 256_000;

export class AiProviderClient {
  async chatCompletion(params: {
    baseUrl: string;
    apiToken: string;
    model: string;
    messages: ChatMessage[];
    timeoutMs?: number;
  }): Promise<ChatCompletionResult> {
    const safeBase = await assertSafeAiBaseUrlResolved(params.baseUrl);
    const url = `${safeBase.replace(/\/+$/, '')}/chat/completions`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          temperature: 0.4,
          max_tokens: MAX_COMPLETION_TOKENS,
        }),
        signal: controller.signal,
        redirect: 'error',
      });

      const rawText = await response.text();
      if (rawText.length > MAX_RESPONSE_BYTES) {
        throw new Error('Ответ провайдера слишком большой');
      }

      let payload: {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      } = {};

      try {
        payload = rawText ? (JSON.parse(rawText) as typeof payload) : {};
      } catch {
        throw new Error(
          response.ok
            ? 'Провайдер вернул некорректный JSON'
            : `Ошибка провайдера (${response.status})`,
        );
      }

      if (!response.ok) {
        const message = sanitizeProviderErrorMessage(
          payload.error?.message?.trim() || `Ошибка провайдера (${response.status})`,
        );
        throw new Error(message);
      }

      const content = payload.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Провайдер вернул пустой ответ');
      }

      return {
        content: content.slice(0, 24_000),
        model: payload.model ?? params.model,
        usage: {
          promptTokens: payload.usage?.prompt_tokens,
          completionTokens: payload.usage?.completion_tokens,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
