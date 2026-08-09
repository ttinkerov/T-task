import { randomBytes } from 'node:crypto';

export function createId(): string {
  return `c${Date.now().toString(36)}${randomBytes(8).toString('hex')}`;
}
