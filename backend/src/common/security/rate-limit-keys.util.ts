import type { RateLimitConfig } from './rate-limit.decorator';

type RateLimitRequest = {
  user?: { id: string };
  params?: Record<string, unknown>;
  body?: unknown;
  ip?: string;

  socket?: { remoteAddress?: string };
};

export function resolveRateLimitKeys(request: RateLimitRequest, config: RateLimitConfig): string[] {
  const keys: string[] = [];

  if (request.user?.id) {
    keys.push(request.user.id);
  } else {
    const body = request.body as { email?: unknown } | undefined;
    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 320) : '';

    const ip = config.keyPrefix.startsWith('auth:')
      ? (request.socket?.remoteAddress ?? request.ip ?? 'unknown')
      : (request.ip ?? 'unknown');

    if (email) {
      keys.push(`ip:${ip}`, `email:${email}`);
    } else {
      keys.push(`ip:${ip}`);
    }
  }

  if (config.includeWorkspaceId) {
    const workspaceId =
      typeof request.params?.workspaceId === 'string' ? request.params.workspaceId.trim() : '';
    if (workspaceId) {
      keys.push(`ws:${workspaceId}`);
    }
  }

  const routeParamKey = resolveRouteParamKey(request, config);
  if (routeParamKey) {
    keys.push(routeParamKey);
  }

  return keys;
}

export function sanitizeRateLimitParam(raw: string): string {
  return raw
    .trim()
    .slice(0, 64)
    .replace(/[^a-zA-Z0-9_-]/g, '');
}

function resolveRouteParamKey(request: RateLimitRequest, config: RateLimitConfig): string | null {
  const paramName = config.includeRouteParam;
  if (!paramName) return null;

  const raw = request.params?.[paramName];
  if (typeof raw !== 'string') return null;

  const sanitized = sanitizeRateLimitParam(raw);
  if (!sanitized) return null;

  return `param:${paramName}:${sanitized}`;
}
