import { ActivityMetadataValue } from './activity.types';

const MAX_METADATA_KEYS = 20;
const MAX_METADATA_STRING_LENGTH = 200;
// Defence-in-depth: block auth material / PII keys if a caller ever passes them.
const SENSITIVE_KEY_PATTERN = /password|secret|token|authorization|cookie|email/i;

export function sanitizeActivityMetadata(
  metadata: Record<string, ActivityMetadataValue> | undefined,
): Record<string, ActivityMetadataValue> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
      .slice(0, MAX_METADATA_KEYS)
      .map(([key, value]) => [
        key,
        typeof value === 'string' ? value.slice(0, MAX_METADATA_STRING_LENGTH) : value,
      ]),
  );
}
