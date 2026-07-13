export function getApiBaseUrl(): string {
  if (typeof window === 'undefined' && process.env.API_INTERNAL_URL) {
    return process.env.API_INTERNAL_URL.replace(/\/$/, '');
  }

  const publicUrl = process.env.NEXT_PUBLIC_API_URL;

  if (publicUrl) {
    return publicUrl.replace(/\/$/, '');
  }

  return 'http://localhost:3001';
}
