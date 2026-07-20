import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export type EncryptedToken = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

function keyFromEnv(raw: string): Buffer {
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('AI_TOKEN_ENC_KEY must be a base64-encoded 32-byte key');
  }
  return key;
}

export function encryptToken(plain: string, encKeyBase64: string): EncryptedToken {
  const key = keyFromEnv(encKeyBase64);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decryptToken(payload: EncryptedToken, encKeyBase64: string): string {
  const key = keyFromEnv(encKeyBase64);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function tokenLast4(plain: string): string {
  const trimmed = plain.trim();
  if (trimmed.length <= 4) return trimmed;
  return trimmed.slice(-4);
}
