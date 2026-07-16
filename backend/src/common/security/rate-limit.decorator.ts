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
