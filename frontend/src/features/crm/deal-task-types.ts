export interface LinkedDealSummary {
  id: string;
  title: string;
  amount: number | null;
  stageId: string;
  stageName: string;
  funnelId: string;
}

export interface LinkedTaskSummary {
  id: string;
  title: string;
  columnId: string;
  columnName: string;
  completed: boolean;
}

export interface TaskDealLink {
  dealId: string;
  taskId: string;
  createdAt: string;
  deal: LinkedDealSummary;
}

export interface DealTaskLink {
  dealId: string;
  taskId: string;
  createdAt: string;
  task: LinkedTaskSummary;
}
