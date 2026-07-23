import { lookup } from 'dns/promises';
import { isIP } from 'net';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
]);

export type PinnedIp = {
  address: string;
  family: 4 | 6;
};

export type SafeAiEndpoint = {
  baseUrl: string;
  pinned: PinnedIp;
};

/** Normalize hostname / IP for private-range checks (handles IPv4-mapped IPv6). */
export function normalizeHostForIpCheck(hostname: string): string {
  const bare =
    hostname
      .trim()
      .toLowerCase()
      .replace(/^\[|\]$/g, '')
      .split('%')[0] ?? '';

  const dottedMapped = bare.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dottedMapped?.[1]) {
    return dottedMapped[1];
  }

  // Node may canonicalize to ::ffff:a9fe:a9fe
  const hexMapped = bare.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (hexMapped?.[1] && hexMapped[2]) {
    const hi = Number.parseInt(hexMapped[1], 16);
    const lo = Number.parseInt(hexMapped[2], 16);
    return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
  }

  return bare;
}

export function isBlockedIpAddress(ipOrHost: string): boolean {
  const value = normalizeHostForIpCheck(ipOrHost);
  const version = isIP(value);

  if (version === 4) {
    const parts = value.split('.').map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    return false;
  }

  if (version === 6) {
    if (value === '::1' || value === '::') return true;
    if (value.startsWith('fc') || value.startsWith('fd')) return true; // ULA
    if (value.startsWith('fe80')) return true; // link-local

    // Deprecated IPv4-compatible form ::a9fe:a9fe → 169.254.169.254 (not ::ffff:)
    const compatMatch = value.match(/^::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
    if (compatMatch?.[1] && compatMatch[2]) {
      const hi = Number.parseInt(compatMatch[1], 16);
      const lo = Number.parseInt(compatMatch[2], 16);
      const ipv4 = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
      if (isBlockedIpAddress(ipv4)) return true;
    }

    return false;
  }

  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    BLOCKED_HOSTS.has(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    return true;
  }
  return isBlockedIpAddress(host);
}

/** Sync URL shape validation; returns normalized origin+pathname without trailing slash. */
export function assertSafeAiBaseUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error('Некорректный base URL');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Base URL должен использовать HTTPS');
  }
  if (url.username || url.password) {
    throw new Error('Base URL не должен содержать логин или пароль');
  }
  if (url.port && url.port !== '443') {
    throw new Error('Кастомный порт для AI API не разрешён');
  }

  if (isBlockedHostname(url.hostname)) {
    throw new Error('Base URL указывает на недопустимый хост');
  }

  const path = url.pathname.replace(/\/+$/, '') || '';
  return `${url.origin}${path}`;
}

/**
 * Resolve DNS once, reject private/metadata addresses, and return a pinned IP
 * so the outbound HTTPS client can skip a second (rebinding-prone) lookup.
 */
export async function resolveSafeAiEndpoint(rawUrl: string): Promise<SafeAiEndpoint> {
  const baseUrl = assertSafeAiBaseUrl(rawUrl);
  const hostname = new URL(baseUrl).hostname;
  const normalized = normalizeHostForIpCheck(hostname);
  const literalFamily = isIP(normalized);

  if (literalFamily === 4 || literalFamily === 6) {
    if (isBlockedIpAddress(hostname)) {
      throw new Error('Base URL указывает на недопустимый хост');
    }
    return {
      baseUrl,
      pinned: { address: normalized, family: literalFamily },
    };
  }

  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error('Не удалось разрешить host base URL');
  }

  if (!records.length) {
    throw new Error('Не удалось разрешить host base URL');
  }

  for (const record of records) {
    if (isBlockedIpAddress(record.address)) {
      throw new Error('Base URL указывает на недопустимый хост');
    }
  }

  const preferred =
    records.find((record) => record.family === 4) ??
    records.find((record) => isIP(record.address) === 4) ??
    records[0];
  const family = (isIP(preferred.address) || preferred.family) as 4 | 6;
  if (family !== 4 && family !== 6) {
    throw new Error('Не удалось разрешить host base URL');
  }

  return {
    baseUrl,
    pinned: { address: preferred.address, family },
  };
}

/** @deprecated Prefer resolveSafeAiEndpoint — keeps URL-only API for callers that ignore pinning. */
export async function assertSafeAiBaseUrlResolved(rawUrl: string): Promise<string> {
  const endpoint = await resolveSafeAiEndpoint(rawUrl);
  return endpoint.baseUrl;
}

/** dns.lookup-compatible function that always returns the validated address. */
export function createPinnedLookup(pinned: PinnedIp) {
  return (
    _hostname: string,
    _options: unknown,
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
  ): void => {
    callback(null, pinned.address, pinned.family);
  };
}

export function sanitizeProviderErrorMessage(message: string): string {
  const cleaned = message
    .replace(/sk-[a-zA-Z0-9_-]+/gi, '[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/api[_-]?key["']?\s*[:=]\s*["']?[\w-]+/gi, 'api_key=[redacted]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')
    .replace(/\[[0-9a-f:]+\]/gi, '[ip]')
    .trim()
    .slice(0, 180);
  return cleaned || 'Ошибка провайдера';
}
