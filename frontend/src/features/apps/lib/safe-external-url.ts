export function isSafeHttpsUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}
