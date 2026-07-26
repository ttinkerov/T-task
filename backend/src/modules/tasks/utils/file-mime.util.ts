const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const GIF87 = Buffer.from('GIF87a');
const GIF89 = Buffer.from('GIF89a');
const WEBP_RIFF = Buffer.from('RIFF');
const WEBP_WEBP = Buffer.from('WEBP');
const PDF = Buffer.from('%PDF-');

export function detectAllowedBinaryMime(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG)) {
    return 'image/png';
  }

  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(JPEG)) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).equals(GIF87) || buffer.subarray(0, 6).equals(GIF89))
  ) {
    return 'image/gif';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(WEBP_RIFF) &&
    buffer.subarray(8, 12).equals(WEBP_WEBP)
  ) {
    return 'image/webp';
  }

  if (buffer.length >= 5 && buffer.subarray(0, 5).equals(PDF)) {
    return 'application/pdf';
  }

  return null;
}

export function isSafePlainText(buffer: Buffer): boolean {
  if (buffer.includes(0)) {
    return false;
  }

  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString('utf8').trimStart();
  const lower = head.toLowerCase();

  if (
    lower.startsWith('<!doctype') ||
    lower.startsWith('<html') ||
    lower.startsWith('<svg') ||
    lower.startsWith('<?xml')
  ) {
    return false;
  }

  return true;
}
