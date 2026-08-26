import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitConfig {
  keyPrefix: string;
  windowSeconds: number;
  maxAttempts: number;

  includeWorkspaceId?: boolean;

  includeRouteParam?: string;
}

export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

export const DEFAULT_AUTH_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'auth:rate',
  windowSeconds: 60,
  maxAttempts: 5,
};

export const AUTH_FORGOT_PASSWORD_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'auth:forgot-password',
  windowSeconds: 600,
  maxAttempts: 5,
};

export const AUTH_RESET_PASSWORD_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'auth:reset-password',
  windowSeconds: 600,
  maxAttempts: 10,
};

export const AUTH_SESSION_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'auth:session',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const AUTH_ME_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'auth:me',
  windowSeconds: 60,
  maxAttempts: 120,
};

export const PUBLIC_FORM_GET_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'public-form:get',
  windowSeconds: 60,
  maxAttempts: 60,
  includeRouteParam: 'token',
};

export const PUBLIC_FORM_SUBMIT_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'public-form:submit',
  windowSeconds: 60,
  maxAttempts: 10,
  includeRouteParam: 'token',
};

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

export const AI_RAG_REINDEX_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'ai:rag-reindex',
  windowSeconds: 60,
  maxAttempts: 2,
  includeWorkspaceId: true,
};

export const INVITATION_CREATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'invitation:create',
  windowSeconds: 60,
  maxAttempts: 20,
  includeWorkspaceId: true,
};

export const INVITATION_ACCEPT_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'invitation:accept',
  windowSeconds: 60,
  maxAttempts: 20,
  includeRouteParam: 'token',
};

export const DEAL_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'deal:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

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

export const BOARD_GET_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'board:get',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

export const BOARD_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'board:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

export const TASK_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'task:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

export const FUNNEL_GET_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'funnel:get',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

export const FUNNEL_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'funnel:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

export const FORM_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'form:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

export const FORM_READ_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'form:read',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

export const ATTACHMENT_READ_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'task-attachment:read',
  windowSeconds: 60,
  maxAttempts: 120,
  includeWorkspaceId: true,
};

export const SPRINT_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'sprint:mutate',
  windowSeconds: 60,
  maxAttempts: 30,
  includeWorkspaceId: true,
};

export const SPRINT_READ_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'sprint:read',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};

export const WORKSPACE_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'workspace:mutate',
  windowSeconds: 60,
  maxAttempts: 30,
  includeWorkspaceId: true,
};

export const WORKSPACE_READ_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'workspace:read',
  windowSeconds: 60,
  maxAttempts: 120,
  includeWorkspaceId: true,
};

export const TASK_READ_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'task:read',
  windowSeconds: 60,
  maxAttempts: 120,
  includeWorkspaceId: true,
};

export const RESOURCE_READ_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'resource:read',
  windowSeconds: 60,
  maxAttempts: 120,
  includeWorkspaceId: true,
};

export const COMMENT_READ_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'comment:read',
  windowSeconds: 60,
  maxAttempts: 120,
  includeWorkspaceId: true,
};

export const NOTIFICATION_READ_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'notification:read',
  windowSeconds: 60,
  maxAttempts: 120,
  includeWorkspaceId: true,
};

export const WATCHER_MUTATE_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'watcher:mutate',
  windowSeconds: 60,
  maxAttempts: 60,
  includeWorkspaceId: true,
};
