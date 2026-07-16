function hasControlCharacters(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if ((code >= 0 && code <= 31) || code === 127) {
      return true;
    }
  }

  return false;
}

export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback = '/dashboard/board',
): string {
  if (!path) {
    return fallback;
  }

  const trimmed = path.trim();

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  if (trimmed.includes('\\') || trimmed.includes('@') || trimmed.includes(':')) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(trimmed);

    if (decoded.includes('\\') || decoded.includes('@') || decoded.includes(':')) {
      return fallback;
    }

    if (hasControlCharacters(decoded)) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}
