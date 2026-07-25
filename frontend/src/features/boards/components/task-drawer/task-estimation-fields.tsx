'use client';

import {
  COMPLEXITY_OPTIONS,
  PRIORITY_OPTIONS,
  TIME_ESTIMATE_OPTIONS,
  type TaskPriority,
} from '../../types';
import { FieldHint } from '../field-hint';

export function TaskEstimationFields({
  priority,
  complexity,
  timeEstimateMinutes,
  actualMinutes,
  dueDate,
  onPriorityChange,
  onComplexityChange,
  onTimeEstimateChange,
  onActualMinutesChange,
  onDueDateChange,
}: {
  priority: TaskPriority | '';
  complexity: number | '';
  timeEstimateMinutes: number | '';
  actualMinutes: number | '';
  dueDate: string;
  onPriorityChange: (value: TaskPriority | '') => void;
  onComplexityChange: (value: number | '') => void;
  onTimeEstimateChange: (value: number | '') => void;
  onActualMinutesChange: (value: number | '') => void;
  onDueDateChange: (value: string) => void;
}) {
  return (
    <>
      <div className="task-drawer__grid">
        <label className="task-drawer__field">
          <span className="task-drawer__label">
            Приоритет
            <FieldHint text="Насколько срочно взяться за задачу относительно остальных." />
          </span>
          <select
            value={priority}
            onChange={(event) => onPriorityChange(event.target.value as TaskPriority | '')}
            className="glass-input"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="task-drawer__field">
          <span className="task-drawer__label">
            Очки (SP)
            <FieldHint text="Story Points — оценка сложности, не часов. Нужна для velocity спринта." />
          </span>
          <select
            value={complexity}
            onChange={(event) =>
              onComplexityChange(event.target.value === '' ? '' : Number(event.target.value))
            }
            className="glass-input"
          >
            {COMPLEXITY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="task-drawer__grid">
        <label className="task-drawer__field">
          <span className="task-drawer__label">
            Оценка времени
            <FieldHint text="Сколько времени планируете потратить. Для сравнения с фактом." />
          </span>
          <select
            value={timeEstimateMinutes}
            onChange={(event) =>
              onTimeEstimateChange(event.target.value === '' ? '' : Number(event.target.value))
            }
            className="glass-input"
          >
            {TIME_ESTIMATE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="task-drawer__field">
          <span className="task-drawer__label">
            Фактическое время
            <FieldHint text="Сколько реально ушло. Можно заполнить вручную или таймером." />
          </span>
          <select
            value={actualMinutes}
            onChange={(event) =>
              onActualMinutesChange(event.target.value === '' ? '' : Number(event.target.value))
            }
            className="glass-input"
          >
            {TIME_ESTIMATE_OPTIONS.map((option) => (
              <option key={`actual-${option.label}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="task-drawer__field">
        <span className="task-drawer__label">
          Дедлайн
          <FieldHint text="Крайний срок. Просроченные задачи подсвечиваются на доске." />
        </span>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => onDueDateChange(event.target.value)}
          className="glass-input"
        />
      </label>
    </>
  );
}
