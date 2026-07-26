/**
 * HTTP API base URL.
 *
 * In the browser we use same-origin (`''`) and Next.js rewrites proxy `/api/*`
 * to the Nest backend. That way Set-Cookie from auth lands on the frontend host
 * and Next middleware can see `access_token`.
 *
 * Server-side (RSC / route handlers) talks to the backend directly.
 */
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

/** Socket.IO must hit the Nest host directly (Next rewrites do not proxy WS). */
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

/** Absolute origin for user-facing links (calendar feeds, shares). */
export function getPublicOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
