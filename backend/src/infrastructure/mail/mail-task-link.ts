/** Build absolute task deep link for outbound email. */
export function buildMailTaskLink(
  appUrl: string,
  taskId: string,
  workspaceId?: string | null,
): string {
  const base = appUrl.replace(/\/$/, '') || 'http://localhost:3000';
  const params = new URLSearchParams({ task: taskId });
  if (workspaceId) {
    params.set('workspace', workspaceId);
  }
  return `${base}/dashboard/board?${params.toString()}`;
}
