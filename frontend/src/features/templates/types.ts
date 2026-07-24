export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskTemplate {
  id: string;
  workspaceId: string;
  name: string;
  title: string | null;
  description: string | null;
  priority: TaskPriority | null;
  complexity: number | null;
  timeEstimateMinutes: number | null;
  checklistGates: boolean;
  tagIds: string[];
  subtaskTitles: string[];
  checklistItems: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface DealTemplate {
  id: string;
  workspaceId: string;
  name: string;
  title: string | null;
  description: string | null;
  amount: number | null;
  contactName: string | null;
  companyName: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskTemplatePayload = {
  name: string;
  title?: string;
  description?: string;
  priority?: TaskPriority | null;
  complexity?: number | null;
  timeEstimateMinutes?: number | null;
  checklistGates?: boolean;
  tagIds?: string[];
  subtaskTitles?: string[];
  checklistItems?: string[];
};

export type UpdateTaskTemplatePayload = Partial<CreateTaskTemplatePayload>;

export type CreateDealTemplatePayload = {
  name: string;
  title?: string;
  description?: string;
  amount?: number | null;
  contactName?: string;
  companyName?: string;
};

export type UpdateDealTemplatePayload = Partial<CreateDealTemplatePayload>;
