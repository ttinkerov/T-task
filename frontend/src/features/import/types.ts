export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ImportColumnMapping {
  status: string;
  columnId?: string;
  newColumnName?: string;
}

export interface ImportTaskRow {
  title: string;
  status: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assignee?: string;
  labels?: string[];
}

export interface ImportTasksPayload {
  boardId?: string;
  columnMappings: ImportColumnMapping[];
  rows: ImportTaskRow[];
}

export interface ImportRowResult {
  index: number;
  title: string;
  status: 'created' | 'skipped';
  reason?: string;
  warnings: string[];
}

export interface ImportTasksResult {
  boardId: string;
  created: number;
  skipped: number;
  total: number;
  results: ImportRowResult[];
}

export interface ParsedCsvRow {
  title: string;
  status: string;
  description: string;
  priorityRaw: string;
  dueDateRaw: string;
  assignee: string;
  labels: string[];
}

export interface ParsedCsvFile {
  rows: ParsedCsvRow[];
  statuses: string[];
  warnings: string[];
}
