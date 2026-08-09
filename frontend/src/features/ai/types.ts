export type AiProvider = 'OPENAI' | 'OPENROUTER' | 'GROQ' | 'CUSTOM';

export type AiSettings = {
  configured: boolean;
  provider: AiProvider;
  model: string;
  baseUrl: string | null;
  tokenLast4: string | null;
  embeddingConfigured: boolean;
  embeddingProvider: AiProvider | null;
  embeddingModel: string | null;
  embeddingBaseUrl: string | null;
  embeddingTokenLast4: string | null;
  updatedAt: string | null;
};

export type UpsertAiSettingsPayload = {
  provider: AiProvider;
  baseUrl?: string;
  model?: string;
  apiToken: string;
  embeddingProvider?: AiProvider;
  embeddingBaseUrl?: string;
  embeddingModel?: string;
  embeddingApiToken?: string;
  clearEmbedding?: boolean;
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
  taskId?: string;
  useRag?: boolean;
};

export type AiCitation = {
  sourceType: 'TASK' | 'COMMENT';
  sourceId: string;
  title: string;
  href: string | null;
};

export type AiChatResult = {
  reply: string;
  model: string;
  usage: { promptTokens?: number; completionTokens?: number } | null;
  citations?: AiCitation[];
};

export type AiRagStatus = {
  indexedChunks: number;
  lastIndexedAt: string | null;
  ragAvailable: boolean;
  embeddingModel: string;
  embeddingConfigured: boolean;
  provider: AiProvider | null;
  embeddingProvider: AiProvider | null;
};

export type AiTestResult = {
  ok: boolean;
  model: string;
  sample: string;
};

export type AiSummaryScope = 'sprint' | 'day';

export type AiSummaryPayload = {
  scope: AiSummaryScope;
  sprintId?: string;
  date?: string;
};

export type AiSummaryResult = {
  summary: string;
  scope: AiSummaryScope;
  period: {
    from: string;
    to: string;
    label: string;
  };
  stats: {
    completedCount: number;
    completedPoints: number;
    openCount: number;
    topAssignees: Array<{ name: string; completedCount: number }>;
  };
  model: string;
};

export type EpicBreakdownDraft = {
  title: string;
  description: string;
};

export type ProposeEpicBreakdownPayload = {
  instructions?: string;
};

export type ProposeEpicBreakdownResult = {
  tasks: EpicBreakdownDraft[];
  model: string;
};

export type ApplyEpicBreakdownPayload = {
  tasks: EpicBreakdownDraft[];
};

export type ApplyEpicBreakdownResult = {
  epicId: string;
  createdCount: number;
};

export const AI_PROVIDER_OPTIONS: Array<{ value: AiProvider; label: string }> = [
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'OPENROUTER', label: 'OpenRouter' },
  { value: 'GROQ', label: 'Groq' },
  { value: 'CUSTOM', label: 'Custom (OpenAI-compatible)' },
];

export const AI_EMBEDDING_PROVIDER_OPTIONS: Array<{ value: AiProvider; label: string }> = [
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'OPENROUTER', label: 'OpenRouter' },
  { value: 'CUSTOM', label: 'Custom (OpenAI-compatible)' },
];
