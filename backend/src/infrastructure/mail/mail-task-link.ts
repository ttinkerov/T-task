/** Build absolute task deep link for outbound email. */
export function buildMailTaskLink(appUrl: string, taskId: string): string {
  const base = appUrl.replace(/\/$/, '') || 'http://localhost:3000';
  const params = new URLSearchParams({ task: taskId });
  return `${base}/dashboard/board?${params.toString()}`;
}
