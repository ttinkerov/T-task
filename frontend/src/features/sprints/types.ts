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
  totalPoints: number;
  days: Array<{ date: string; remaining: number; remainingPoints: number; ideal: number }>;
};

export type SprintVelocityItem = {
  sprintId: string;
  name: string;
  closedAt: string | null;
  active: boolean;
  committedPoints: number;
  completedPoints: number;
};

export type SprintVelocity = {
  sprints: SprintVelocityItem[];
  averageVelocity: number;
};

export type CreateSprintPayload = {
  name: string;
  startDate: string;
  endDate: string;
};
