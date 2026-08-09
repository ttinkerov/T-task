import { Injectable } from '@nestjs/common';
import { resolveSafeAiEndpoint, sanitizeProviderErrorMessage } from './utils/base-url-guard.util';
import { pinnedHttpsRequest } from './utils/pinned-https-request.util';
import { RAG_DEFAULT_EMBEDDING_MODEL, RAG_EMBEDDING_DIMENSIONS } from './rag/rag.constants';

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

export type EmbeddingsResult = {
  embeddings: number[][];
  model: string;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_COMPLETION_TOKENS = 2048;
const MAX_RESPONSE_BYTES = 256_000;
const MAX_EMBEDDING_RESPONSE_BYTES = 2_000_000;

@Injectable()
export class AiProviderClient {
  async chatCompletion(params: {
    baseUrl: string;
    apiToken: string;
    model: string;
    messages: ChatMessage[];
    timeoutMs?: number;
  }): Promise<ChatCompletionResult> {
    const endpoint = await resolveSafeAiEndpoint(params.baseUrl);
    const url = `${endpoint.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await pinnedHttpsRequest(url, endpoint.pinned, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          temperature: 0.4,
          max_tokens: MAX_COMPLETION_TOKENS,
        }),
        signal: controller.signal,
        maxResponseBytes: MAX_RESPONSE_BYTES,
      });

      const rawText = response.text;
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
          response.status >= 200 && response.status < 300
            ? 'Провайдер вернул некорректный JSON'
            : `Ошибка провайдера (${response.status})`,
        );
      }

      if (response.status < 200 || response.status >= 300) {
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

  async createEmbeddings(params: {
    baseUrl: string;
    apiToken: string;
    model?: string;
    inputs: string[];
    timeoutMs?: number;
  }): Promise<EmbeddingsResult> {
    const inputs = params.inputs.map((item) => item.trim()).filter(Boolean);
    if (inputs.length === 0) {
      return { embeddings: [], model: params.model ?? RAG_DEFAULT_EMBEDDING_MODEL };
    }

    const endpoint = await resolveSafeAiEndpoint(params.baseUrl);
    const url = `${endpoint.baseUrl.replace(/\/+$/, '')}/embeddings`;
    const model = params.model?.trim() || RAG_DEFAULT_EMBEDDING_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await pinnedHttpsRequest(url, endpoint.pinned, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model,
          input: inputs,
        }),
        signal: controller.signal,
        maxResponseBytes: MAX_EMBEDDING_RESPONSE_BYTES,
      });

      let payload: {
        error?: { message?: string };
        data?: Array<{ embedding?: number[]; index?: number }>;
        model?: string;
      } = {};

      try {
        payload = response.text ? (JSON.parse(response.text) as typeof payload) : {};
      } catch {
        throw new Error(
          response.status >= 200 && response.status < 300
            ? 'Провайдер вернул некорректный JSON embeddings'
            : `Ошибка embeddings (${response.status})`,
        );
      }

      if (response.status < 200 || response.status >= 300) {
        const message = sanitizeProviderErrorMessage(
          payload.error?.message?.trim() || `Ошибка embeddings (${response.status})`,
        );
        throw new Error(message);
      }

      const rows = [...(payload.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      if (rows.length !== inputs.length) {
        throw new Error('Провайдер вернул неполное число embeddings');
      }

      const embeddings = rows.map((row) => {
        const vector = row.embedding;
        if (!Array.isArray(vector) || vector.length !== RAG_EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Ожидалась размерность embeddings ${RAG_EMBEDDING_DIMENSIONS}, получено ${vector?.length ?? 0}`,
          );
        }
        return vector.map((value) => Number(value));
      });

      return {
        embeddings,
        model: payload.model ?? model,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
