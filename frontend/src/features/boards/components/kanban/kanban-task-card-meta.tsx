'use client';

import { formatMinutes } from '@/shared/lib/format-duration';
import { PRIORITY_LABELS, type BoardTask, type TaskTag } from '../../types';

const EMPTY_TAGS: TaskTag[] = [];
const EMPTY_SUBTASKS: NonNullable<BoardTask['subtasks']> = [];

export function KanbanTaskCardMeta({
  task,
  dueLabel,
  recurrenceLabel,
  overdueLabel,
  agingLevel,
  isOverdue,
  customFieldChips,
}: {
  task: BoardTask;
  dueLabel: string | null;
  recurrenceLabel: string | null;
  overdueLabel: string | null;
  agingLevel: string;
  isOverdue: boolean;
  customFieldChips: Array<{ id: string; label: string }>;
}) {
  const tags = task.tags ?? EMPTY_TAGS;
  const subtasks = task.subtasks ?? EMPTY_SUBTASKS;

  if (!(
    task.priority ||
    task.complexity ||
    task.timeEstimateMinutes ||
    task.actualMinutes ||
    task.timerStartedAt ||
    task.completedAt ||
    dueLabel ||
    recurrenceLabel ||
    overdueLabel ||
    tags.length > 0 ||
    subtasks.length > 0 ||
    customFieldChips.length > 0 ||
    task.assignee
  )) {
    return null;
  }

  return (
    <div className="kanban-task-meta">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag.id}
          className="tag-chip"
          style={{ background: `${tag.color}22`, color: tag.color, borderColor: tag.color }}
        >
          <i style={{ background: tag.color }} />
          {tag.name}
        </span>
      ))}
      {subtasks.length > 0 ? (
        <span className="kanban-task-chip">
          {subtasks.filter((item) => item.completed).length}/{subtasks.length} шагов
        </span>
      ) : null}
      {overdueLabel ? (
        <span
          className={`kanban-task-chip ${
            agingLevel === 'due-today' || agingLevel === 'due-soon'
              ? 'kanban-task-chip--due-soon'
              : 'kanban-task-chip--overdue'
          }`}
        >
          {overdueLabel}
        </span>
      ) : null}
      {recurrenceLabel ? (
        <span className="kanban-task-chip kanban-task-chip--recurrence">{recurrenceLabel}</span>
      ) : null}
      {task.assignee ? (
        <span className="kanban-task-chip">{task.assignee.name.split(' ')[0]}</span>
      ) : null}
      {task.priority ? (
        <span className={`kanban-task-chip kanban-task-chip--priority-${task.priority}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      ) : null}
      {task.complexity ? <span className="kanban-task-chip">{task.complexity} SP</span> : null}
      {task.timeEstimateMinutes ? (
        <span className="kanban-task-chip kanban-task-chip--estimate">
          {formatMinutes(task.timeEstimateMinutes)}
        </span>
      ) : null}
      {task.actualMinutes ? (
        <span className="kanban-task-chip kanban-task-chip--actual">
          факт {formatMinutes(task.actualMinutes)}
        </span>
      ) : null}
      {task.timerStartedAt ? (
        <span className="kanban-task-chip kanban-task-chip--timer">таймер запущен</span>
      ) : null}
      {task.completedAt ? (
        <span className="kanban-task-chip kanban-task-chip--complete">выполнено</span>
      ) : null}
      {dueLabel ? (
        <span className={`kanban-task-chip ${isOverdue ? 'kanban-task-chip--overdue-date' : ''}`}>
          {dueLabel}
        </span>
      ) : null}
      {customFieldChips.map((chip) => (
        <span key={chip.id} className="kanban-task-chip kanban-task-chip--custom">
          {chip.label}
        </span>
      ))}
    </div>
  );
}
