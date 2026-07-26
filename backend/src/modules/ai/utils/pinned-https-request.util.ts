import * as https from 'node:https';
import type { PinnedIp } from './base-url-guard.util';
import { createPinnedLookup } from './base-url-guard.util';

export type PinnedHttpsResponse = {
  status: number;
  text: string;
};

export function pinnedHttpsRequest(
  urlString: string,
  pinned: PinnedIp,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
    maxResponseBytes: number;
  },
): Promise<PinnedHttpsResponse> {
  const url = new URL(urlString);
  if (url.protocol !== 'https:') {
    return Promise.reject(new Error('Только HTTPS'));
  }

  return new Promise((resolve, reject) => {
    if (init.signal?.aborted) {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      reject(error);
      return;
    }

    const req = https.request(
      {
        protocol: 'https:',
        hostname: url.hostname,
        port: url.port ? Number(url.port) : 443,
        path: `${url.pathname}${url.search}`,
        method: init.method,
        headers: {
          ...init.headers,
          Host: url.host,
        },
        servername: url.hostname,
        rejectUnauthorized: true,
        lookup: createPinnedLookup(pinned),
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;

        res.on('error', () => {});

        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > init.maxResponseBytes) {
            res.destroy();
            reject(new Error('Ответ провайдера слишком большой'));
            return;
          }
          chunks.push(chunk);
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    const onAbort = () => {
      req.destroy();
      const error = new Error('Aborted');
      error.name = 'AbortError';
      reject(error);
    };

    init.signal?.addEventListener('abort', onAbort, { once: true });

    req.on('error', (error) => {
      init.signal?.removeEventListener('abort', onAbort);
      if ((error as Error).name === 'AbortError') {
        reject(error);
        return;
      }
      reject(error);
    });

    req.on('close', () => {
      init.signal?.removeEventListener('abort', onAbort);
    });

    if (init.body) {
      req.write(init.body);
    }
    req.end();
  });
}
