export type AiProvider = 'OPENAI' | 'OPENROUTER' | 'GROQ' | 'CUSTOM';

export type AiSettings = {
  configured: boolean;
  provider: AiProvider;
  model: string;
  baseUrl: string | null;
  tokenLast4: string | null;
  updatedAt: string | null;
};

export type UpsertAiSettingsPayload = {
  provider: AiProvider;
  baseUrl?: string;
  model?: string;
  apiToken: string;
};

export type AiChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type AiChatPayload = {
  messages: AiChatMessage[];
  mode?: 'chat' | 'task';
  taskTitle?: string;
  taskDescription?: string;
};

export type AiChatResult = {
  reply: string;
  model: string;
  usage: { promptTokens?: number; completionTokens?: number } | null;
};

export type AiTestResult = {
  ok: boolean;
  model: string;
  sample: string;
};

export const AI_PROVIDER_OPTIONS: Array<{ value: AiProvider; label: string }> = [
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'OPENROUTER', label: 'OpenRouter' },
  { value: 'GROQ', label: 'Groq' },
  { value: 'CUSTOM', label: 'Custom (OpenAI-compatible)' },
];
