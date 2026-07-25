'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { memo } from 'react';
import { TaskCheckbox } from '@/components/ui/task-checkbox';
import type { CustomFieldDefinition } from '@/features/custom-fields/types';
import { formatRecurrenceLabel } from '@/shared/lib/format-recurrence';
import { formatCustomFieldValue, toPlainMentionText } from '../../lib/task-card-format';
import { formatAgingLabel, getAgingLevel, isDoneColumn, isTaskOverdue } from '../../lib/overdue';
import type { BoardColumn, BoardTask } from '../../types';
import type { TaskSelectEvent } from './types';
import { KanbanTaskCardMeta } from './kanban-task-card-meta';

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
    : null;
  const recurrenceLabel = formatRecurrenceLabel(task.recurrenceRule, task.recurrenceWeekdays);
  const overdueLabel = formatAgingLabel(task, column, allColumns);
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
  const description = task.description ? toPlainMentionText(task.description, memberNames) : null;

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
        <input
          type="checkbox"
          className="kanban-task-card__select"
          checked={selected}
          aria-label={`Выбрать задачу ${task.title}`}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            onToggleSelect(task.id, {
              shiftKey: (event.nativeEvent as MouseEvent).shiftKey,
              metaKey: (event.nativeEvent as MouseEvent).metaKey,
              ctrlKey: (event.nativeEvent as MouseEvent).ctrlKey,
            })
          }
        />
        <TaskCheckbox
          animated={false}
          checked={isComplete}
          ariaLabel={isComplete ? 'Задача выполнена' : 'Отметить выполненной'}
          onChange={(checked) => {
            if (checked && !isComplete) onCompleteTask(task);
          }}
        />
        <button
          type="button"
          className="kanban-task-card__drag"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="Перетащить задачу"
        >
          <GripVertical size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="kanban-task-card__title">{task.title}</p>
          {description ? <p className="kanban-task-card__desc">{description}</p> : null}
          <KanbanTaskCardMeta
            task={task}
            dueLabel={dueLabel}
            recurrenceLabel={recurrenceLabel}
            overdueLabel={overdueLabel}
            agingLevel={agingLevel}
            isOverdue={isOverdue}
            customFieldChips={customFieldChips}
          />
        </div>
      </div>
    </div>
  );
});
