import { describe, expect, it } from 'vitest';
import { resolveRateLimitKeys, sanitizeRateLimitParam } from './rate-limit-keys.util';
import {
  PUBLIC_FORM_SUBMIT_RATE_LIMIT,
  PUBLIC_FORM_SUBMIT_WORKSPACE_RATE_LIMIT,
} from './rate-limit.decorator';

describe('resolveRateLimitKeys', () => {
  it('keys anonymous public form submit by IP and form token', () => {
    const keys = resolveRateLimitKeys(
      {
        ip: '203.0.113.9',
        params: { token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      },
      PUBLIC_FORM_SUBMIT_RATE_LIMIT,
    );

    expect(keys).toEqual(['ip:203.0.113.9', 'param:token:a1b2c3d4-e5f6-7890-abcd-ef1234567890']);
  });

  it('still applies form token budget when IP is spoofable/unknown', () => {
    const keys = resolveRateLimitKeys(
      {
        ip: '1.2.3.4',
        params: { token: 'form-token-abc' },
      },
      PUBLIC_FORM_SUBMIT_RATE_LIMIT,
    );

    expect(keys).toContain('param:token:form-token-abc');
    expect(keys.some((key) => key.startsWith('param:token:'))).toBe(true);
  });

  it('sanitizes hostile route param values', () => {
    expect(sanitizeRateLimitParam('../../etc/passwd!!!')).toBe('etcpasswd');
    expect(sanitizeRateLimitParam('x'.repeat(100)).length).toBe(64);
  });

  it('adds workspace budget key for authenticated routes', () => {
    const keys = resolveRateLimitKeys(
      {
        user: { id: 'user-1' },
        params: { workspaceId: 'ws-9' },
      },
      {
        keyPrefix: 'export:csv',
        windowSeconds: 60,
        maxAttempts: 10,
        includeWorkspaceId: true,
      },
    );

    expect(keys).toEqual(['user-1', 'ws:ws-9']);
  });

  it('uses socket remoteAddress for auth rate limits (not spoofable XFF)', () => {
    const keys = resolveRateLimitKeys(
      {
        ip: '203.0.113.9',
        socket: { remoteAddress: '198.51.100.10' },
        body: { email: 'a@example.com' },
      },
      { keyPrefix: 'auth:rate', windowSeconds: 60, maxAttempts: 5 },
    );

    expect(keys).toContain('ip:198.51.100.10');
    expect(keys).not.toContain('ip:203.0.113.9');
    expect(keys).toContain('email:a@example.com');
  });
});

describe('PUBLIC_FORM_SUBMIT_WORKSPACE_RATE_LIMIT', () => {
  it('is a shared workspace budget separate from per-form', () => {
    expect(PUBLIC_FORM_SUBMIT_WORKSPACE_RATE_LIMIT.keyPrefix).toBe('public-form:submit-ws');
    expect(PUBLIC_FORM_SUBMIT_WORKSPACE_RATE_LIMIT.maxAttempts).toBe(60);
    expect(PUBLIC_FORM_SUBMIT_RATE_LIMIT.includeRouteParam).toBe('token');
  });
});
