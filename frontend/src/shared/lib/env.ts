export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }

  if (process.env.API_INTERNAL_URL) {
    return process.env.API_INTERNAL_URL.replace(/\/$/, '');
  }

  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl) {
    return publicUrl.replace(/\/$/, '');
  }

  return 'http://localhost:3001';
}

export function getRealtimeBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl) {
    return publicUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3001';
}

export function getPublicOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
