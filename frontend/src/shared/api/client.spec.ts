import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, API_FETCH_TIMEOUT_MS, apiFetch } from './client';

vi.mock('@/shared/lib/env', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

describe('apiFetch timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('rejects with ApiError 408 when the request exceeds the default timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      }),
    );

    const pending = apiFetch('/api/v1/health');
    const expectation = expect(pending).rejects.toMatchObject({
      name: 'ApiError',
      status: 408,
      message: 'Превышено время ожидания ответа сервера',
    });

    await vi.advanceTimersByTimeAsync(API_FETCH_TIMEOUT_MS);
    await expectation;
  });

  it('propagates an externally aborted signal without rewriting as timeout', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      }),
    );

    const pending = apiFetch('/api/v1/health', { signal: controller.signal });
    const expectation = expect(pending).rejects.toBeInstanceOf(DOMException);
    controller.abort();
    await expectation;
  });

  it('returns successful JSON responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ success: true, data: { ok: true }, error: null }),
      })),
    );

    await expect(apiFetch<{ ok: boolean }>('/api/v1/health')).resolves.toEqual({
      success: true,
      data: { ok: true },
      error: null,
    });
  });

  it('throws ApiError for unsuccessful API envelopes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ success: false, data: null, error: 'boom' }),
      })),
    );

    await expect(apiFetch('/api/v1/health')).rejects.toBeInstanceOf(ApiError);
  });
});
