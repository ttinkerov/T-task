'use client';

import { PRIORITY_LABELS, type BoardColumn, type BoardTask } from '../types';
import {
  addDays,
  buildMonthGrid,
  buildWeekDays,
  getTimelinePlacement,
  startOfWeek,
  toDateKey,
  type BoardViewMode,
} from '../lib/task-view-utils';

const VIEW_OPTIONS: { value: BoardViewMode; label: string; icon: string }[] = [
  { value: 'BOARD', label: 'Доски', icon: '▦' },
  { value: 'LIST', label: 'Список', icon: '☷' },
  { value: 'WEEK', label: 'Неделя', icon: '7' },
  { value: 'MONTH', label: 'Месяц', icon: '□' },
  { value: 'GANTT', label: 'Гант', icon: '↔' },
];

interface ViewToolbarProps {
  mode: BoardViewMode;
  anchor: Date;
  onModeChange: (mode: BoardViewMode) => void;
  onAnchorChange: (date: Date) => void;
}

export function TaskViewToolbar({ mode, anchor, onModeChange, onAnchorChange }: ViewToolbarProps) {
  const hasDateNavigation = mode === 'WEEK' || mode === 'MONTH' || mode === 'GANTT';
  const step = mode === 'MONTH' ? 1 : mode === 'WEEK' ? 7 : 14;
  const label =
    mode === 'MONTH'
      ? anchor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
      : mode === 'WEEK'
        ? formatRange(buildWeekDays(anchor))
        : mode === 'GANTT'
          ? formatRange(
              Array.from({ length: 14 }, (_, index) => addDays(startOfWeek(anchor), index)),
            )
          : null;

  return (
    <div className="task-view-toolbar">
      <div className="task-view-toolbar__modes" role="group" aria-label="Режим отображения">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={mode === option.value ? 'task-view-toolbar__mode--active' : undefined}
            onClick={() => onModeChange(option.value)}
            aria-pressed={mode === option.value}
          >
            <span aria-hidden="true">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>

      {hasDateNavigation ? (
        <div className="task-view-toolbar__dates">
          <button
            type="button"
            onClick={() =>
              onAnchorChange(
                mode === 'MONTH'
                  ? new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
                  : addDays(anchor, -step),
              )
            }
            aria-label="Предыдущий период"
          >
            ‹
          </button>
          <button type="button" onClick={() => onAnchorChange(new Date())}>
            Сегодня
          </button>
          <strong>{label}</strong>
          <button
            type="button"
            onClick={() =>
              onAnchorChange(
                mode === 'MONTH'
                  ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
                  : addDays(anchor, step),
              )
            }
            aria-label="Следующий период"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TaskDisplayView({
  mode,
  columns,
  anchor,
  onOpenTask,
}: {
  mode: Exclude<BoardViewMode, 'BOARD'>;
  columns: BoardColumn[];
  anchor: Date;
  onOpenTask: (taskId: string) => void;
}) {
  const tasks = columns.flatMap((column) =>
    column.tasks.map((task) => ({ task, columnName: column.name })),
  );

  if (mode === 'LIST') {
    return <TaskListView tasks={tasks} onOpenTask={onOpenTask} />;
  }
  if (mode === 'WEEK') {
    return <TaskWeekView tasks={tasks} anchor={anchor} onOpenTask={onOpenTask} />;
  }
  if (mode === 'MONTH') {
    return <TaskMonthView tasks={tasks} anchor={anchor} onOpenTask={onOpenTask} />;
  }
  return <TaskGanttView tasks={tasks} anchor={anchor} onOpenTask={onOpenTask} />;
}

type DisplayTask = { task: BoardTask; columnName: string };

function TaskListView({
  tasks,
  onOpenTask,
}: {
  tasks: DisplayTask[];
  onOpenTask: (taskId: string) => void;
}) {
  if (tasks.length === 0) return <EmptyView />;

  return (
    <div className="task-list-view">
      <table>
        <caption className="sr-only">Список задач с исполнителями, статусами и дедлайнами</caption>
        <thead>
          <tr>
            <th scope="col">Задача</th>
            <th scope="col">Статус</th>
            <th scope="col">Исполнитель</th>
            <th scope="col">Приоритет</th>
            <th scope="col">Дедлайн</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(({ task, columnName }) => (
            <tr key={task.id}>
              <td>
                <button type="button" onClick={() => onOpenTask(task.id)}>
                  {task.title}
                </button>
              </td>
              <td>
                <span className="task-list-view__status">{columnName}</span>
              </td>
              <td>{task.assignee?.name ?? 'Не назначен'}</td>
              <td>{task.priority ? PRIORITY_LABELS[task.priority] : '—'}</td>
              <td>{formatDueDate(task.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskWeekView({
  tasks,
  anchor,
  onOpenTask,
}: {
  tasks: DisplayTask[];
  anchor: Date;
  onOpenTask: (taskId: string) => void;
}) {
  const days = buildWeekDays(anchor);
  const undated = tasks.filter(({ task }) => !task.dueDate);

  return (
    <div className="task-week-view">
      <div className="task-week-view__days">
        {days.map((day) => {
          const dateTasks = tasks.filter(
            ({ task }) => task.dueDate && toDateKey(task.dueDate) === toDateKey(day),
          );
          return (
            <section
              key={toDateKey(day)}
              className={toDateKey(day) === toDateKey(new Date()) ? 'is-today' : undefined}
              aria-label={day.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            >
              <header>
                <span>{day.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                <strong>{day.getDate()}</strong>
              </header>
              <div>
                {dateTasks.map((item) => (
                  <CompactTask key={item.task.id} item={item} onOpenTask={onOpenTask} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {undated.length > 0 ? <UndatedTasks tasks={undated} onOpenTask={onOpenTask} /> : null}
    </div>
  );
}

function TaskMonthView({
  tasks,
  anchor,
  onOpenTask,
}: {
  tasks: DisplayTask[];
  anchor: Date;
  onOpenTask: (taskId: string) => void;
}) {
  const days = buildMonthGrid(anchor);
  const undated = tasks.filter(({ task }) => !task.dueDate);

  return (
    <div className="task-month-layout">
      <div className="task-month-view">
        <div className="task-month-view__weekdays" aria-hidden="true">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="task-month-view__grid">
          {days.map((day) => {
            const dateTasks = tasks.filter(
              ({ task }) => task.dueDate && toDateKey(task.dueDate) === toDateKey(day),
            );
            const classNames = [
              day.getMonth() !== anchor.getMonth() ? 'is-outside' : '',
              toDateKey(day) === toDateKey(new Date()) ? 'is-today' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <section
                key={toDateKey(day)}
                className={classNames || undefined}
                aria-label={day.toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              >
                <time dateTime={toDateKey(day)}>{day.getDate()}</time>
                <div>
                  {dateTasks.map((item) => (
                    <CompactTask key={item.task.id} item={item} onOpenTask={onOpenTask} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {undated.length > 0 ? <UndatedTasks tasks={undated} onOpenTask={onOpenTask} /> : null}
    </div>
  );
}

function TaskGanttView({
  tasks,
  anchor,
  onOpenTask,
}: {
  tasks: DisplayTask[];
  anchor: Date;
  onOpenTask: (taskId: string) => void;
}) {
  const rangeStart = startOfWeek(anchor);
  const days = Array.from({ length: 14 }, (_, index) => addDays(rangeStart, index));
  const datedTasks = tasks.filter(({ task }) =>
    getTimelinePlacement(task, rangeStart, days.length),
  );
  const undated = tasks.filter(({ task }) => !task.dueDate);

  return (
    <div className="task-gantt-view">
      <div className="task-gantt-view__scroll">
        <div className="task-gantt-view__header">
          <strong>Задача</strong>
          <div>
            {days.map((day) => (
              <time
                key={toDateKey(day)}
                dateTime={toDateKey(day)}
                className={toDateKey(day) === toDateKey(new Date()) ? 'is-today' : undefined}
              >
                <span>{day.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                {day.getDate()}
              </time>
            ))}
          </div>
        </div>
        {datedTasks.map((item) => {
          const placement = getTimelinePlacement(item.task, rangeStart, days.length)!;
          return (
            <div className="task-gantt-view__row" key={item.task.id}>
              <button type="button" onClick={() => onOpenTask(item.task.id)}>
                <strong>{item.task.title}</strong>
                <small>{item.columnName}</small>
              </button>
              <div className="task-gantt-view__track">
                <button
                  type="button"
                  className={`task-gantt-view__bar ${
                    item.task.priority
                      ? `task-gantt-view__bar--${item.task.priority.toLowerCase()}`
                      : ''
                  }`}
                  style={{
                    gridColumn: `${placement.startIndex + 1} / span ${placement.span}`,
                  }}
                  onClick={() => onOpenTask(item.task.id)}
                  title={`${item.task.title}: до ${formatDueDate(item.task.dueDate)}`}
                >
                  {item.task.title}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {datedTasks.length === 0 && undated.length === 0 ? <EmptyView /> : null}
      {undated.length > 0 ? <UndatedTasks tasks={undated} onOpenTask={onOpenTask} /> : null}
    </div>
  );
}

function CompactTask({
  item,
  onOpenTask,
}: {
  item: DisplayTask;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <button
      type="button"
      className={`compact-view-task ${
        item.task.priority ? `compact-view-task--${item.task.priority.toLowerCase()}` : ''
      }`}
      onClick={() => onOpenTask(item.task.id)}
    >
      <strong>{item.task.title}</strong>
      <small>{item.task.assignee?.name ?? item.columnName}</small>
    </button>
  );
}

function UndatedTasks({
  tasks,
  onOpenTask,
}: {
  tasks: DisplayTask[];
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <section className="task-undated">
      <h3>Без дедлайна</h3>
      <div>
        {tasks.map((item) => (
          <CompactTask key={item.task.id} item={item} onOpenTask={onOpenTask} />
        ))}
      </div>
    </section>
  );
}

function EmptyView() {
  return <p className="task-display-empty">В этом режиме пока нет подходящих задач.</p>;
}

function formatDueDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Без срока';
}

function formatRange(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  return `${first.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })} — ${last.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}
