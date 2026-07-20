import { AiProvider } from '@prisma/client';

export type ProviderPreset = {
  baseUrl: string;
  defaultModel: string;
  label: string;
};

export const AI_PROVIDER_PRESETS: Record<Exclude<AiProvider, 'CUSTOM'>, ProviderPreset> = {
  OPENAI: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  OPENROUTER: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
  },
  GROQ: {
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
  },
};

export function resolveProviderBaseUrl(
  provider: AiProvider,
  customBaseUrl?: string | null,
): string {
  if (provider === 'CUSTOM') {
    if (!customBaseUrl?.trim()) {
      throw new Error('Для CUSTOM укажите base URL');
    }
    return customBaseUrl.trim().replace(/\/+$/, '');
  }

  return AI_PROVIDER_PRESETS[provider].baseUrl;
}

export function resolveDefaultModel(provider: AiProvider, model?: string | null): string {
  if (model?.trim()) return model.trim();
  if (provider === 'CUSTOM') return 'gpt-4o-mini';
  return AI_PROVIDER_PRESETS[provider].defaultModel;
}
