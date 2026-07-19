import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitConfig {
  keyPrefix: string;
  windowSeconds: number;
  maxAttempts: number;
}

export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

export const DEFAULT_AUTH_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'auth:rate',
  windowSeconds: 60,
  maxAttempts: 20,
};

export const PUBLIC_FORM_GET_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'public-form:get',
  windowSeconds: 60,
  maxAttempts: 60,
};

export const PUBLIC_FORM_SUBMIT_RATE_LIMIT: RateLimitConfig = {
  keyPrefix: 'public-form:submit',
  windowSeconds: 60,
  maxAttempts: 10,
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
