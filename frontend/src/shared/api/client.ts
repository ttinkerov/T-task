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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const { headers: initHeaders, ...restInit } = init ?? {};

  const response = await fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    ...restInit,
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
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  init?: Omit<RequestInit, 'body' | 'method'>,
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const { headers: initHeaders, ...restInit } = init ?? {};

  const headers = new Headers(initHeaders);
  headers.delete('Content-Type');

  const response = await fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    method: 'POST',
    ...restInit,
    headers,
    body: formData,
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new ApiError(body.error ?? 'Не удалось выполнить запрос', response.status);
  }

  return body;
}
