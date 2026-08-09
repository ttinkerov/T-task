import { Injectable, Logger } from '@nestjs/common';
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

const FETCH_TIMEOUT_MS = 5_000;
const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

@Injectable()
export class OutboundWebhookService {
  private readonly logger = new Logger(OutboundWebhookService.name);

  async dispatch(params: { url: string; payload: Record<string, unknown> }): Promise<void> {
    try {
      await this.assertSafeUrl(params.url);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(params.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'user-agent': 'T-task-webhook/1.0',
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

  private async assertSafeUrl(rawUrl: string) {
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

    const addresses = isIP(hostname)
      ? [hostname]
      : (await lookup(hostname, { all: true })).map((entry) => entry.address);

    for (const address of addresses) {
      if (isPrivateIp(address)) {
        throw new Error('Вебхук не может указывать на приватный адрес');
      }
    }
  }
}

function isPrivateIp(address: string) {
  if (address.includes(':')) {
    const normalized = address.toLowerCase();
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    );
  }

  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}
