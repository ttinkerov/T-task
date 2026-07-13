export type TeamSize = 'SOLO' | 'SMALL' | 'MEDIUM' | 'LARGE';

export type WorkspaceUseCase =
  'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'PRODUCT' | 'OPERATIONS' | 'OTHER';

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  position: number;
  columnId: string;
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
  tasks: BoardTask[];
}

export interface BoardView {
  id: string;
  workspaceId: string;
  name: string;
  columns: BoardColumn[];
}

export const TEAM_SIZE_OPTIONS: { value: TeamSize; label: string }[] = [
  { value: 'SOLO', label: 'Только я' },
  { value: 'SMALL', label: '2–10 человек' },
  { value: 'MEDIUM', label: '11–50 человек' },
  { value: 'LARGE', label: '50+ человек' },
];

export const USE_CASE_OPTIONS: { value: WorkspaceUseCase; label: string }[] = [
  { value: 'DEVELOPMENT', label: 'Разработка' },
  { value: 'DESIGN', label: 'Дизайн' },
  { value: 'MARKETING', label: 'Маркетинг' },
  { value: 'PRODUCT', label: 'Продукт' },
  { value: 'OPERATIONS', label: 'Операции' },
  { value: 'OTHER', label: 'Другое' },
];
