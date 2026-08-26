import { Injectable, Logger } from '@nestjs/common';
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

const FETCH_TIMEOUT_MS = 5_000;

/**
 * Hostnames that are always blocked regardless of DNS resolution.
 * Includes well-known metadata service hostnames and link-local patterns.
 */
const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

@Injectable()
export class OutboundWebhookService {
  private readonly logger = new Logger(OutboundWebhookService.name);

  async dispatch(params: { url: string; payload: Record<string, unknown> }): Promise<void> {
    try {
      const prepared = await this.prepareSafeFetch(params.url);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(prepared.fetchUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'user-agent': 'T-task-webhook/1.0',
            // Pass original hostname so the server can route by virtual host.
            // This also prevents the second DNS lookup that would enable rebinding.
            host: prepared.originalHost,
          },
          body: JSON.stringify(params.payload),
          signal: controller.signal,
          redirect: 'error',
        });
        if (!response.ok) {
          this.logger.warn(`Webhook ${params.url} responded ${response.status}`);
        }
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      this.logger.warn(
        `Webhook dispatch failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Validates the URL, resolves DNS exactly once, checks every resolved IP
   * against the private/blocked blocklist, and returns:
   *   - fetchUrl: URL with hostname replaced by the resolved IP (prevents rebinding)
   *   - originalHost: original hostname[:port] for the Host request header
   *
   * Throwing from this method causes dispatch() to log and swallow the error,
   * which is the intended behaviour (silent drop on unsafe targets).
   */
  private async prepareSafeFetch(
    rawUrl: string,
  ): Promise<{ fetchUrl: string; originalHost: string }> {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error('Некорректный URL вебхука');
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Вебхук поддерживает только http/https');
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local')) {
      throw new Error('Запрещённый хост вебхука');
    }

    // Resolve DNS once. If hostname is already an IP literal, skip lookup.
    const addresses: string[] = isIP(hostname)
      ? [hostname]
      : (await lookup(hostname, { all: true })).map((entry) => entry.address);

    if (addresses.length === 0) {
      throw new Error('Не удалось разрешить хост вебхука');
    }

    for (const address of addresses) {
      if (isPrivateIp(address)) {
        throw new Error('Вебхук не может указывать на приватный адрес');
      }
    }

    // Use the first resolved IP to avoid a second DNS lookup (DNS rebinding fix).
    const resolvedIp = addresses[0];
    const fetchUrl = buildIpUrl(parsed, resolvedIp);
    // Include port only when it differs from the scheme default.
    const originalHost = parsed.port ? `${hostname}:${parsed.port}` : hostname;

    return { fetchUrl, originalHost };
  }
}

/**
 * Builds a URL identical to `original` but with the hostname replaced by
 * `resolvedIp`.  IPv6 addresses are wrapped in brackets per RFC 2732.
 *
 * Exported for unit testing.
 */
export function buildIpUrl(original: URL, resolvedIp: string): string {
  const host = resolvedIp.includes(':') ? `[${resolvedIp}]` : resolvedIp;
  const portPart = original.port ? `:${original.port}` : '';
  return `${original.protocol}//${host}${portPart}${original.pathname}${original.search}`;
}

/**
 * Returns true when `address` is a non-routable or cloud-metadata IP that
 * must never be a webhook target.
 *
 * IPv4 ranges blocked:
 *   - 0.0.0.0/8        unspecified
 *   - 10.0.0.0/8       RFC-1918
 *   - 100.64.0.0/10    IANA Shared Address (CGNAT), incl. Alibaba IMDS 100.100.100.200
 *   - 127.0.0.0/8      loopback
 *   - 169.254.0.0/16   link-local / AWS & Azure IMDS
 *   - 172.16.0.0/12    RFC-1918
 *   - 192.168.0.0/16   RFC-1918
 *
 * IPv6 ranges blocked:
 *   - ::1              loopback
 *   - fc00::/7         Unique Local Address (ULA) — covers fc and fd prefix
 *   - fe80::/10        link-local — covers fe80..febf prefix
 *
 * Exported for unit testing.
 */
export function isPrivateIp(address: string): boolean {
  if (address.includes(':')) {
    const normalized = address.toLowerCase();

    // IPv6-mapped IPv4 (::ffff:x.x.x.x) and SIIT (::ffff:0:x.x.x.x)
    const mapped = extractMappedIpv4(normalized);
    if (mapped !== null) {
      return isPrivateIp(mapped);
    }

    // ::1 loopback
    if (normalized === '::1') return true;
    // ULA fc00::/7 — first byte 0xFC or 0xFD
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    // link-local fe80::/10 — first byte 0xFE, second byte 0x80–0xBF
    if (
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }
    return false;
  }

  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 || // 0.0.0.0/8  unspecified
    a === 10 || // 10.0.0.0/8 RFC-1918
    a === 127 || // 127.0.0.0/8 loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 CGNAT / Alibaba IMDS
    (a === 169 && b === 254) || // 169.254.0.0/16 link-local / IMDS
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 RFC-1918
    (a === 192 && b === 168) // 192.168.0.0/16 RFC-1918
  );
}

/** Returns dotted IPv4 for ::ffff:… forms, or null if not mapped. */
function extractMappedIpv4(normalizedIpv6: string): string | null {
  const dottedMatch = normalizedIpv6.match(/^::ffff:(?:0:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dottedMatch) {
    return dottedMatch[1];
  }

  const hexMatch = normalizedIpv6.match(/^::ffff:(?:0:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMatch) {
    const hi = Number.parseInt(hexMatch[1], 16);
    const lo = Number.parseInt(hexMatch[2], 16);
    if (Number.isNaN(hi) || Number.isNaN(lo)) {
      return '0.0.0.0';
    }
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
  }

  return null;
}
