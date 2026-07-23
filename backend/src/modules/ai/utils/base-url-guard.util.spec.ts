import { beforeEach, describe, expect, it, vi } from 'vitest';

const { lookupMock } = vi.hoisted(() => ({
  lookupMock: vi.fn(),
}));

vi.mock('dns/promises', () => ({
  lookup: lookupMock,
}));

import {
  assertSafeAiBaseUrl,
  createPinnedLookup,
  isBlockedIpAddress,
  resolveSafeAiEndpoint,
  sanitizeProviderErrorMessage,
} from './base-url-guard.util';

describe('assertSafeAiBaseUrl', () => {
  it('accepts https openai url', () => {
    expect(assertSafeAiBaseUrl('https://api.openai.com/v1/')).toBe('https://api.openai.com/v1');
  });

  it('rejects http', () => {
    expect(() => assertSafeAiBaseUrl('http://api.openai.com/v1')).toThrow(/HTTPS/);
  });

  it('rejects localhost', () => {
    expect(() => assertSafeAiBaseUrl('https://localhost/v1')).toThrow(/недопустимый/);
  });

  it('rejects 127.0.0.0/8', () => {
    expect(() => assertSafeAiBaseUrl('https://127.0.0.2/v1')).toThrow(/недопустимый/);
  });

  it('rejects private ip', () => {
    expect(() => assertSafeAiBaseUrl('https://192.168.1.10/v1')).toThrow(/недопустимый/);
  });

  it('rejects ipv4-mapped metadata', () => {
    expect(() => assertSafeAiBaseUrl('https://[::ffff:169.254.169.254]/v1')).toThrow(
      /недопустимый/,
    );
  });

  it('rejects ipv4-compatible metadata', () => {
    expect(() => assertSafeAiBaseUrl('https://[::a9fe:a9fe]/v1')).toThrow(/недопустимый/);
  });

  it('rejects credentials in url', () => {
    expect(() => assertSafeAiBaseUrl('https://user:pass@api.openai.com/v1')).toThrow(/логин/);
  });
});

describe('resolveSafeAiEndpoint', () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it('pins literal public IPv4 without DNS', async () => {
    const endpoint = await resolveSafeAiEndpoint('https://8.8.8.8/v1/');
    expect(endpoint.baseUrl).toBe('https://8.8.8.8/v1');
    expect(endpoint.pinned).toEqual({ address: '8.8.8.8', family: 4 });
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('rejects literal metadata IP', async () => {
    await expect(resolveSafeAiEndpoint('https://169.254.169.254/v1')).rejects.toThrow(
      /недопустимый/,
    );
  });

  it('rejects hostname resolving to metadata IP', async () => {
    lookupMock.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
    await expect(resolveSafeAiEndpoint('https://evil.example.com/v1')).rejects.toThrow(
      /недопустимый/,
    );
  });

  it('rejects hostname with any private record in the set', async () => {
    lookupMock.mockResolvedValue([
      { address: '203.0.113.10', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ]);
    await expect(resolveSafeAiEndpoint('https://mixed.example.com/v1')).rejects.toThrow(
      /недопустимый/,
    );
  });

  it('pins first public IPv4 from DNS', async () => {
    lookupMock.mockResolvedValue([
      { address: '2001:db8::1', family: 6 },
      { address: '203.0.113.50', family: 4 },
    ]);
    const endpoint = await resolveSafeAiEndpoint('https://api.example.com/v1');
    expect(endpoint.pinned).toEqual({ address: '203.0.113.50', family: 4 });
  });

  it('rejects DNS failure', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(resolveSafeAiEndpoint('https://missing.example.com/v1')).rejects.toThrow(
      /разрешить/,
    );
  });
});

describe('createPinnedLookup', () => {
  it('always returns the validated address and ignores hostname', () => {
    const lookup = createPinnedLookup({ address: '203.0.113.10', family: 4 });
    const callback = vi.fn();
    lookup('evil.example', {}, callback);
    expect(callback).toHaveBeenCalledWith(null, '203.0.113.10', 4);
  });
});

describe('isBlockedIpAddress', () => {
  it('blocks loopback and cgnat', () => {
    expect(isBlockedIpAddress('127.0.0.1')).toBe(true);
    expect(isBlockedIpAddress('100.64.1.1')).toBe(true);
    expect(isBlockedIpAddress('8.8.8.8')).toBe(false);
  });

  it('blocks ipv4-compatible private form', () => {
    expect(isBlockedIpAddress('::a9fe:a9fe')).toBe(true);
    expect(isBlockedIpAddress('::c0a8:0101')).toBe(true);
  });
});

describe('sanitizeProviderErrorMessage', () => {
  it('redacts api keys', () => {
    expect(sanitizeProviderErrorMessage('Invalid sk-abcDEF1234567890 token')).toContain(
      '[redacted]',
    );
    expect(sanitizeProviderErrorMessage('Invalid sk-abcDEF1234567890 token')).not.toContain(
      'sk-abc',
    );
  });

  it('redacts IP addresses from transport errors', () => {
    expect(sanitizeProviderErrorMessage('connect ECONNREFUSED 10.0.0.1:443')).not.toContain(
      '10.0.0.1',
    );
    expect(sanitizeProviderErrorMessage('connect ECONNREFUSED 10.0.0.1:443')).toContain('[ip]');
  });
});
