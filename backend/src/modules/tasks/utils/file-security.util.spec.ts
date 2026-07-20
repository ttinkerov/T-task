import { describe, expect, it } from 'vitest';
import { detectAllowedBinaryMime, isSafePlainText } from './file-mime.util';
import { assertPathInsideRoot, resolveUnderRoot } from './storage-path.util';

describe('file-mime.util', () => {
  it('detects png/jpeg/pdf magic bytes', () => {
    expect(
      detectAllowedBinaryMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe('image/png');
    expect(detectAllowedBinaryMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(detectAllowedBinaryMime(Buffer.from('%PDF-1.4'))).toBe('application/pdf');
    expect(detectAllowedBinaryMime(Buffer.from('<html>'))).toBeNull();
  });

  it('rejects html disguised as plain text', () => {
    expect(isSafePlainText(Buffer.from('hello'))).toBe(true);
    expect(isSafePlainText(Buffer.from('<html>boom'))).toBe(false);
    expect(isSafePlainText(Buffer.from([0x00, 0x01]))).toBe(false);
  });
});

describe('storage-path.util', () => {
  it('keeps resolved paths inside the upload root', () => {
    const root = '/tmp/ttask-uploads';
    expect(resolveUnderRoot(root, 'ws', 'task', 'file')).toBe(`${root}/ws/task/file`);
    expect(() => resolveUnderRoot(root, '..', 'etc', 'passwd')).toThrow(/escapes/);
    expect(() => assertPathInsideRoot(root, '/etc/passwd')).toThrow(/escapes/);
  });
});
