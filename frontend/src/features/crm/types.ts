export interface DealAssignee {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface FunnelDeal {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  contactName: string | null;
  companyName: string | null;
  assigneeId: string | null;
  assignee: DealAssignee | null;
  position: number;
  stageId: string;
  createdAt: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  position: number;
  dealTotal?: number;
  truncated?: boolean;
  deals: FunnelDeal[];
}

export interface FunnelView {
  id: string;
  workspaceId: string;
  name: string;
  stages: FunnelStage[];
}

export interface FunnelSummary {
  id: string;
  name: string;
  createdAt: string;
}

export interface UpdateDealPayload {
  title?: string;
  description?: string | null;
  amount?: number | null;
  contactName?: string | null;
  companyName?: string | null;
  assigneeId?: string | null;
}

export function formatDealAmount(amount: number | null): string | null {
  if (amount === null || amount <= 0) {
    return null;
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}
