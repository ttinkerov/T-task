import type { TaskPriority } from '../types';

const PRIORITY_MAP: Record<string, TaskPriority> = {
  lowest: 'LOW',
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  highest: 'URGENT',
  urgent: 'URGENT',
  critical: 'URGENT',
  низкий: 'LOW',
  средний: 'MEDIUM',
  высокий: 'HIGH',
  критический: 'URGENT',
  срочный: 'URGENT',
};

export function mapPriority(raw: string | undefined | null): TaskPriority | undefined {
  if (!raw?.trim()) return undefined;
  return PRIORITY_MAP[raw.trim().toLowerCase()];
}
