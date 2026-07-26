import type { AllTask } from '@/features/all-tasks';

export type EpicBoardColumn = {
  id: string;
  name: string;
};

export type EpicStickyLane = {
  column: EpicBoardColumn;
  tasks: AllTask[];
};

const STICKY_COLORS = [
  '#fef3c7',
  '#dbeafe',
  '#dcfce7',
  '#fce7f3',
  '#e0e7ff',
  '#ffedd5',
  '#f3e8ff',
] as const;

export function stickyColorForTask(taskId: string): string {
  let hash = 0;
  for (let i = 0; i < taskId.length; i += 1) {
    hash = (hash * 31 + taskId.charCodeAt(i)) >>> 0;
  }
  return STICKY_COLORS[hash % STICKY_COLORS.length]!;
}

export function stickyTiltForTask(taskId: string): number {
  let hash = 0;
  for (let i = 0; i < taskId.length; i += 1) {
    hash = (hash * 17 + taskId.charCodeAt(i)) >>> 0;
  }
  return (hash % 7) - 3;
}

export function buildEpicStickyLanes(
  columns: EpicBoardColumn[],
  children: AllTask[],
  epicBoardId: string,
): { lanes: EpicStickyLane[]; foreignCount: number } {
  const onBoard = children.filter((task) => task.board.id === epicBoardId && !task.isEpic);
  const foreignCount = children.filter(
    (task) => task.board.id !== epicBoardId && !task.isEpic,
  ).length;
  const byColumn = new Map<string, AllTask[]>();

  for (const column of columns) {
    byColumn.set(column.id, []);
  }

  for (const task of onBoard) {
    const list = byColumn.get(task.columnId);
    if (list) {
      byColumn.set(task.columnId, [...list, task]);
    }
  }

  const lanes = columns.map((column) => ({
    column,
    tasks: (byColumn.get(column.id) ?? []).slice().sort((a, b) => a.position - b.position),
  }));

  return { lanes, foreignCount };
}
