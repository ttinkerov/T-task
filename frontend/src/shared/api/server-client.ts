import { cookies } from 'next/headers';
import { getApiBaseUrl } from '@/shared/lib/env';
import type { ApiResponse } from './client';

export async function serverApiFetch<T>(path: string): Promise<ApiResponse<T>> {
  const cookieStore = await cookies();
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      cookie: cookieStore.toString(),
    },
    cache: 'no-store',
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(body.error ?? 'Не удалось выполнить запрос');
  }

  return body;
}
