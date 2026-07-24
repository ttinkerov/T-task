import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitConfig {
  keyPrefix: string;
  windowSeconds: number;
  maxAttempts: number;
  /** Also enforce a shared budget keyed by route param workspaceId. */
  includeWorkspaceId?: boolean;
  /**
   * Also enforce a budget keyed by a route param (e.g. public form `token`).
   * Unspoofable unlike client-controlled Forwarded IP.
   */
  includeRouteParam?: string;
}

export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

export const DEFAULT_AUTH_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'auth:rate',
  windowSeconds: 60,
  maxAttempts: 5,
};

export const PUBLIC_FORM_GET_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'public-form:get',
  windowSeconds: 60,
  maxAttempts: 60,
  includeRouteParam: 'token',
};

/** Per-IP + per-form token (route param). Token budget survives IP spoofing. */
export const PUBLIC_FORM_SUBMIT_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'public-form:submit',
  windowSeconds: 60,
  maxAttempts: 10,
  includeRouteParam: 'token',
};

/** Shared budget across all public forms in a workspace (applied after form lookup). */
export const PUBLIC_FORM_SUBMIT_WORKSPACE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'public-form:submit-ws',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const CALENDAR_FEED_GET_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'calendar-feed:get',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const CALENDAR_FEED_MANAGE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'calendar-feed:manage',
  windowSeconds: 60,
  maxAttempts: 10,
};

export const TASK_RELATION_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'task-relation:mutate',
  windowSeconds: 60,
  maxAttempts: 30,
};

export const DEAL_TASK_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'deal-task:mutate',
  windowSeconds: 60,
  maxAttempts: 30,
};

export const CUSTOM_FIELD_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'custom-field:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const DOD_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'dod:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const TEMPLATE_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'template:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const NOTIFICATION_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'notification:mutate',
  windowSeconds: 60,
  maxAttempts: 120,
};

export const MENTION_SOURCE_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'mention-source:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const BULK_TASK_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'task:bulk-mutate',
  windowSeconds: 60,
  maxAttempts: 20,
};

export const IMPORT_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'import:tasks',
  windowSeconds: 60,
  maxAttempts: 5,
};

export const AI_EPIC_BREAKDOWN_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'ai:epic-breakdown',
  windowSeconds: 60,
  maxAttempts: 8,
  includeWorkspaceId: true,
};

export const AI_EPIC_BREAKDOWN_APPLY_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'ai:epic-breakdown-apply',
  windowSeconds: 60,
  maxAttempts: 10,
  includeWorkspaceId: true,
};

/** CSV export is DB/CPU heavy — stricter than list endpoints. */
export const EXPORT_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'export:csv',
  windowSeconds: 60,
  maxAttempts: 10,
  includeWorkspaceId: true,
};

export const SEARCH_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'search:query',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const ANALYTICS_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'analytics:read',
  windowSeconds: 60,
  maxAttempts: 30,
  includeWorkspaceId: true,
};

export const ALL_TASKS_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'all-tasks:list',
  windowSeconds: 60,
  maxAttempts: 60,
};
