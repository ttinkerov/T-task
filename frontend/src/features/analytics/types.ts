export type StuckTaskItem = {
  id: string;
  title: string;
  columnId: string;
  columnName: string;
  boardId: string;
  boardName: string;
  assignee: { id: string; name: string } | null;
  priority: string | null;
  updatedAt: string;
  createdAt: string;
  daysSinceUpdate: number;
  dueDate: string | null;
  overdueDays: number;
};

export type StuckTasksResult = {
  days: number;
  asOf: string;
  count: number;
  truncated: boolean;
  tasks: StuckTaskItem[];
};

export type StuckTasksInsightResult = {
  insight: string;
  basedOnCount: number;
  days: number;
  model: string;
};

export type StuckTasksParams = {
  days?: number;
  boardId?: string;
  assigneeId?: string;
};
