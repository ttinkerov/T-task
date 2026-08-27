import { getApiBaseUrl } from '@/shared/lib/env';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Default client timeout so hung backends cannot freeze the UI forever. */
export const API_FETCH_TIMEOUT_MS = 30_000;

function withTimeoutSignal(
  timeoutMs: number,
  external?: AbortSignal | null,
): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort();
  };

  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', onExternalAbort);
    },
  };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const { headers: initHeaders, signal, ...restInit } = init ?? {};
  const timed = withTimeoutSignal(API_FETCH_TIMEOUT_MS, signal);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      ...restInit,
      signal: timed.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(initHeaders ?? {}),
      },
    });

    const body = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !body.success) {
      throw new ApiError(body.error ?? 'Не удалось выполнить запрос', response.status);
    }

    return body;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (signal?.aborted) {
        throw error;
      }
      throw new ApiError('Превышено время ожидания ответа сервера', 408);
    }
    throw error;
  } finally {
    timed.cancel();
  }
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  init?: Omit<RequestInit, 'body' | 'method'>,
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const { headers: initHeaders, signal, ...restInit } = init ?? {};
  const timed = withTimeoutSignal(API_FETCH_TIMEOUT_MS, signal);
  const headers = new Headers(initHeaders);
  headers.delete('Content-Type');

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      method: 'POST',
      ...restInit,
      signal: timed.signal,
      headers,
      body: formData,
    });

    const body = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !body.success) {
      throw new ApiError(body.error ?? 'Не удалось выполнить запрос', response.status);
    }

    return body;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (signal?.aborted) {
        throw error;
      }
      throw new ApiError('Превышено время ожидания ответа сервера', 408);
    }
    throw error;
  } finally {
    timed.cancel();
  }
}
