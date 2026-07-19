export function buildTaskLink(
  taskId: string,
  source: 'board' | 'all-tasks' | 'my-tasks' = 'board',
) {
  if (typeof window === 'undefined') {
    return `/dashboard/${source}?task=${encodeURIComponent(taskId)}`;
  }
  return `${window.location.origin}/dashboard/${source}?task=${encodeURIComponent(taskId)}`;
}

export async function copyTaskLink(
  taskId: string,
  source: 'board' | 'all-tasks' | 'my-tasks' = 'board',
) {
  const link = buildTaskLink(taskId, source);
  await navigator.clipboard.writeText(link);
  return link;
}
