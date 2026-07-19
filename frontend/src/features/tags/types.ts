export interface WorkspaceTag {
  id: string;
  name: string;
  color: string;
}

export const TAG_COLOR_OPTIONS = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
] as const;
