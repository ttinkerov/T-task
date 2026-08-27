import { cookies } from 'next/headers';
import { getApiBaseUrl } from '@/shared/lib/env';
import { API_FETCH_TIMEOUT_MS, type ApiResponse } from './client';

export async function serverApiFetch<T>(path: string): Promise<ApiResponse<T>> {
  const cookieStore = await cookies();
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        cookie: cookieStore.toString(),
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    const body = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !body.success) {
      throw new Error(body.error ?? 'Не удалось выполнить запрос');
    }

    return body;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Превышено время ожидания ответа сервера');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
