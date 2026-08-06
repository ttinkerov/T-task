'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import type { CustomFieldDefinition } from '@/features/custom-fields/types';
import { formatMinutes } from '@/shared/lib/format-duration';
import { formatRecurrenceLabel } from '@/shared/lib/format-recurrence';
import KanbanTaskCardBodyView from '@/vue/boards/KanbanTaskCardBody.vue';
import { formatCustomFieldValue, toPlainMentionText } from '../../lib/task-card-format';
import { formatAgingLabel, getAgingLevel, isDoneColumn, isTaskOverdue } from '../../lib/overdue';
import { PRIORITY_LABELS, type BoardColumn, type BoardTask } from '../../types';
import type { TaskSelectEvent } from './types';

export const KanbanTaskCard = memo(function KanbanTaskCard({
  task,
  column,
  allColumns,
  cardFields,
  memberNames,
  selected,
  selectionActive,
  onToggleSelect,
  onOpenTask,
  onCompleteTask,
}: {
  task: BoardTask;
  column: BoardColumn;
  allColumns: BoardColumn[];
  cardFields: CustomFieldDefinition[];
  memberNames: Map<string, string>;
  selected: boolean;
  selectionActive: boolean;
  onToggleSelect: (taskId: string, event: TaskSelectEvent) => void;
  onOpenTask: (taskId: string) => void;
  onCompleteTask: (task: BoardTask) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' as const, columnId: task.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : '';
  const recurrenceLabel = formatRecurrenceLabel(task.recurrenceRule, task.recurrenceWeekdays) ?? '';
  const overdueLabel = formatAgingLabel(task, column, allColumns) ?? '';
  const agingLevel = getAgingLevel(task, column, allColumns);
  const isOverdue = isTaskOverdue(task, column, allColumns);
  const isComplete = Boolean(task.completedAt) || isDoneColumn(column, allColumns);
  const customFieldChips = cardFields
    .map((field) => {
      const entry = task.customFields.find((item) => item.fieldId === field.id);
      const label = formatCustomFieldValue(field, entry?.value ?? null, memberNames);
      return label ? { id: field.id, label } : null;
    })
    .filter((chip): chip is { id: string; label: string } => chip !== null);
  const description = task.description ? toPlainMentionText(task.description, memberNames) : '';

  const tags = (task.tags ?? []).slice(0, 3).map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  }));
  const subtasks = task.subtasks ?? [];
  const subtaskTotal = task.subtaskStats?.total ?? subtasks.length;
  const subtaskCompleted =
    task.subtaskStats?.completed ?? subtasks.filter((item) => item.completed).length;

  const onBodyToggleSelect = useCallback(
    (event: TaskSelectEvent) => {
      onToggleSelect(task.id, event);
    },
    [onToggleSelect, task.id],
  );

  const onComplete = useCallback(() => {
    onCompleteTask(task);
  }, [onCompleteTask, task]);

  const meta = useMemo(
    () => ({
      tags,
      subtaskTotal,
      subtaskCompleted,
      overdueLabel,
      agingLevel,
      recurrenceLabel,
      assigneeName: task.assignee?.name.split(' ')[0] ?? '',
      priority: task.priority ?? '',
      priorityLabel: task.priority ? PRIORITY_LABELS[task.priority] : '',
      complexity: task.complexity ?? '',
      estimateLabel: task.timeEstimateMinutes ? formatMinutes(task.timeEstimateMinutes) : '',
      actualLabel: task.actualMinutes ? formatMinutes(task.actualMinutes) : '',
      timerRunning: Boolean(task.timerStartedAt),
      completed: Boolean(task.completedAt),
      dueLabel,
      isOverdue,
      customFieldChips,
    }),
    [
      tags,
      subtaskTotal,
      subtaskCompleted,
      overdueLabel,
      agingLevel,
      recurrenceLabel,
      task.assignee?.name,
      task.priority,
      task.complexity,
      task.timeEstimateMinutes,
      task.actualMinutes,
      task.timerStartedAt,
      task.completedAt,
      dueLabel,
      isOverdue,
      customFieldChips,
    ],
  );

  const viewProps = useMemo(
    () => ({
      title: task.title,
      description,
      selected,
      isComplete,
      meta,
      onToggleSelect: onBodyToggleSelect,
      onComplete,
    }),
    [task.title, description, selected, isComplete, meta, onBodyToggleSelect, onComplete],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`kanban-task-${task.id}`}
      data-task-id={task.id}
      data-column-id={task.columnId}
      className={`kanban-task-card kanban-task ${selected ? 'kanban-task-card--selected' : ''} ${agingLevel !== 'none' ? `kanban-task-card--aging-${agingLevel}` : ''} ${isOverdue ? 'kanban-task-card--overdue' : ''} ${task.isEpic ? 'kanban-task-card--epic' : ''} ${isDragging ? 'kanban-task--dragging' : ''}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || selectionActive) {
          event.preventDefault();
          onToggleSelect(task.id, event);
          return;
        }
        onOpenTask(task.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenTask(task.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-selected={selected}
    >
      <div className="kanban-task-card__body">
        <button
          type="button"
          className="kanban-task-card__drag"
          style={{ order: 2 }}
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="Перетащить задачу"
        >
          <GripVertical size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <VueIsland component={KanbanTaskCardBodyView} componentProps={viewProps} displayContents />
      </div>
    </div>
  );
});
