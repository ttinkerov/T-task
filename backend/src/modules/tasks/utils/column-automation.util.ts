export type ColumnAutomationAction = 'ASSIGN_USER' | 'START_TIMER' | 'COMPLETE_TASK';

interface ColumnAutomation {
  action: ColumnAutomationAction;
  assigneeId: string | null;
}

interface AutomatableTask {
  actualMinutes: number | null;
  timerStartedAt: Date | null;
  completedAt: Date | null;
}

interface AutomationTaskUpdate {
  assigneeId?: string;
  actualMinutes?: number;
  timerStartedAt?: Date | null;
  completedAt?: Date;
  overdueDays?: number;
}

export function buildAutomationTaskUpdate(
  automations: ColumnAutomation[],
  task: AutomatableTask,
  now: Date,
): AutomationTaskUpdate {
  const update: AutomationTaskUpdate = {};

  for (const automation of automations) {
    if (automation.action === 'ASSIGN_USER' && automation.assigneeId) {
      update.assigneeId = automation.assigneeId;
    }

    if (automation.action === 'START_TIMER' && !task.timerStartedAt && !task.completedAt) {
      update.timerStartedAt = now;
    }

    if (automation.action === 'COMPLETE_TASK' && !task.completedAt) {
      const timerStartedAt =
        update.timerStartedAt instanceof Date ? update.timerStartedAt : task.timerStartedAt;
      const elapsedMinutes = timerStartedAt
        ? Math.max(1, Math.ceil((now.getTime() - timerStartedAt.getTime()) / 60_000))
        : 0;

      update.actualMinutes = (task.actualMinutes ?? 0) + elapsedMinutes;
      update.timerStartedAt = null;
      update.completedAt = now;
      update.overdueDays = 0;
    }
  }

  return update;
}
