import type { CustomFieldDefinition } from '@/features/custom-fields/types';
import type { BoardColumn, BoardTask } from '../../types';

export type TaskSelectEvent = {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
};

export type KanbanColumnViewProps = {
  column: BoardColumn;
  allColumns: BoardColumn[];
  workspaceId: string;
  boardId: string;
  canDelete: boolean;
  canManageAutomations: boolean;
  cardFields: CustomFieldDefinition[];
  memberNames: Map<string, string>;
  selectedIds: Set<string>;
  selectionActive: boolean;
  onToggleSelect: (taskId: string, event: TaskSelectEvent) => void;
  onOpenTask: (taskId: string) => void;
  onCompleteTask: (task: BoardTask) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
};
