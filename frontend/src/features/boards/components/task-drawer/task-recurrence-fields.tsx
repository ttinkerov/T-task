'use client';

import {
  RECURRENCE_ACTION_OPTIONS,
  RECURRENCE_RULE_OPTIONS,
  RECURRENCE_WEEKDAY_OPTIONS,
  type TaskRecurrenceAction,
  type TaskRecurrenceRule,
} from '../../types';
import { FieldHint } from '../field-hint';

export function TaskRecurrenceFields({
  recurrenceRule,
  recurrenceAction,
  recurrenceWeekdays,
  onRecurrenceRuleChange,
  onRecurrenceActionChange,
  onRecurrenceWeekdaysChange,
}: {
  recurrenceRule: TaskRecurrenceRule;
  recurrenceAction: TaskRecurrenceAction;
  recurrenceWeekdays: number[];
  onRecurrenceRuleChange: (rule: TaskRecurrenceRule) => void;
  onRecurrenceActionChange: (action: TaskRecurrenceAction) => void;
  onRecurrenceWeekdaysChange: (days: number[]) => void;
}) {
  const toggleWeekday = (day: number) => {
    onRecurrenceWeekdaysChange(
      recurrenceWeekdays.includes(day)
        ? recurrenceWeekdays.filter((item) => item !== day)
        : [...recurrenceWeekdays, day].sort(),
    );
  };

  return (
    <div className="task-drawer__recurrence">
      <h3 className="task-drawer__recurrence-title">
        Повторение
        <FieldHint text="Автосоздание или перенос задачи по расписанию после завершения." />
      </h3>
      <p className="task-drawer__recurrence-hint">
        При переносе в «Готово» задача автоматически создастся снова или перенесётся на следующий
        срок.
      </p>

      <label className="task-drawer__field">
        <span className="task-drawer__label">Частота</span>
        <select
          value={recurrenceRule}
          onChange={(event) => {
            const nextRule = event.target.value as TaskRecurrenceRule;
            onRecurrenceRuleChange(nextRule);
            if (nextRule !== 'WEEKLY') {
              onRecurrenceWeekdaysChange([]);
            }
          }}
          className="glass-input"
        >
          {RECURRENCE_RULE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {recurrenceRule === 'WEEKLY' ? (
        <div className="task-drawer__field">
          <span className="task-drawer__label">Дни недели</span>
          <div className="task-drawer__weekdays">
            {RECURRENCE_WEEKDAY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  recurrenceWeekdays.includes(option.value)
                    ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
                    : 'board-workload__toggle-btn'
                }
                onClick={() => toggleWeekday(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {recurrenceRule !== 'NONE' ? (
        <label className="task-drawer__field">
          <span className="task-drawer__label">
            После выполнения
            <FieldHint text="Дублировать — новая карточка. Перенести — та же задача с новым сроком." />
          </span>
          <select
            value={recurrenceAction}
            onChange={(event) =>
              onRecurrenceActionChange(event.target.value as TaskRecurrenceAction)
            }
            className="glass-input"
          >
            {RECURRENCE_ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
