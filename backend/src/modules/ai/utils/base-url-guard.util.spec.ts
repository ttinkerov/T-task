import { describe, expect, it } from 'vitest';
import {
  assertSafeAiBaseUrl,
  isBlockedIpAddress,
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

  it('rejects credentials in url', () => {
    expect(() => assertSafeAiBaseUrl('https://user:pass@api.openai.com/v1')).toThrow(/логин/);
  });
});

describe('isBlockedIpAddress', () => {
  it('blocks loopback and cgnat', () => {
    expect(isBlockedIpAddress('127.0.0.1')).toBe(true);
    expect(isBlockedIpAddress('100.64.1.1')).toBe(true);
    expect(isBlockedIpAddress('8.8.8.8')).toBe(false);
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
});
