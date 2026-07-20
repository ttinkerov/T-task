export type Sprint = {
  id: string;
  workspaceId: string;
  name: string;
  startDate: string;
  endDate: string;
  closedAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SprintBurndown = {
  sprintId: string;
  name: string;
  total: number;
  days: Array<{ date: string; remaining: number; ideal: number }>;
};

export type CreateSprintPayload = {
  name: string;
  startDate: string;
  endDate: string;
};
