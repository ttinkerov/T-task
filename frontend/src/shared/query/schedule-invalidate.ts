import type { QueryClient, QueryKey } from '@tanstack/react-query';

const pending = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Coalesce board/list invalidations so rapid DnD / multi-mutations
 * produce one refetch instead of a thundering herd.
 */
export function scheduleInvalidateQueries(
  queryClient: QueryClient,
  queryKey: QueryKey,
  delayMs = 400,
) {
  const key = JSON.stringify(queryKey);
  const existing = pending.get(key);
  if (existing) clearTimeout(existing);

  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      void queryClient.invalidateQueries({ queryKey });
    }, delayMs),
  );
}
