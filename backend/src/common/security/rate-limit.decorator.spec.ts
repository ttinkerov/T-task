import { describe, expect, it } from 'vitest';
import {
  ALL_TASKS_RATE_LIMIT,
  ANALYTICS_RATE_LIMIT,
  EXPORT_RATE_LIMIT,
  SEARCH_RATE_LIMIT,
} from './rate-limit.decorator';

describe('heavy-read rate limits (MEDIUM-3)', () => {
  it('export is stricter and workspace-scoped', () => {
    expect(EXPORT_RATE_LIMIT.maxAttempts).toBe(10);
    expect(EXPORT_RATE_LIMIT.windowSeconds).toBe(60);
    expect(EXPORT_RATE_LIMIT.includeWorkspaceId).toBe(true);
    expect(EXPORT_RATE_LIMIT.keyPrefix).toBe('export:csv');
  });

  it('search allows interactive typing budget', () => {
    expect(SEARCH_RATE_LIMIT.maxAttempts).toBe(60);
    expect(SEARCH_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it('analytics shares a tighter read budget across endpoints', () => {
    expect(ANALYTICS_RATE_LIMIT.maxAttempts).toBe(30);
    expect(ANALYTICS_RATE_LIMIT.includeWorkspaceId).toBe(true);
    expect(ANALYTICS_RATE_LIMIT.keyPrefix).toBe('analytics:read');
  });

  it('all-tasks matches other list endpoints', () => {
    expect(ALL_TASKS_RATE_LIMIT.maxAttempts).toBe(60);
    expect(ALL_TASKS_RATE_LIMIT.keyPrefix).toBe('all-tasks:list');
  });
});
