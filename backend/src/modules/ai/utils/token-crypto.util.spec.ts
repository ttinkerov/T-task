import { describe, expect, it } from 'vitest';
import { decryptToken, encryptToken, tokenLast4 } from './token-crypto.util';

describe('token-crypto.util', () => {
  const key = Buffer.alloc(32, 7).toString('base64');

  it('encrypts and decrypts round-trip', () => {
    const plain = 'sk-test-secret-token-123456';
    const encrypted = encryptToken(plain, key);
    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();
    expect(decryptToken(encrypted, key)).toBe(plain);
  });

  it('rejects wrong key length', () => {
    expect(() => encryptToken('x', Buffer.alloc(16).toString('base64'))).toThrow(/32-byte/);
  });

  it('tokenLast4 returns last four chars', () => {
    expect(tokenLast4('sk-abcdefgh')).toBe('efgh');
    expect(tokenLast4('ab')).toBe('ab');
  });
});
