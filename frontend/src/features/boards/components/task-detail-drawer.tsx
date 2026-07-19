'use client';

import { TaskAttachmentsSection } from '@/features/attachments';
import { FormEvent, useEffect, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import { MentionText, MentionTextarea } from '@/features/mentions';
import { useMembersQuery } from '@/features/workspaces/hooks';
import {
  useCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useDeleteTaskMutation,
  useDuplicateTaskMutation,
  useTaskDetailQuery,
  useUpdateTaskMutation,
} from '../hooks';
import { copyTaskLink } from '../lib/task-link';
import {
  COMPLEXITY_OPTIONS,
  PRIORITY_OPTIONS,
  RECURRENCE_ACTION_OPTIONS,
  RECURRENCE_RULE_OPTIONS,
  RECURRENCE_WEEKDAY_OPTIONS,
  TIME_ESTIMATE_OPTIONS,
  type BoardTask,
  type TaskRelationCandidate,
  type TaskPriority,
  type TaskRecurrenceAction,
  type TaskRecurrenceRule,
} from '../types';
import { TaskCustomFieldsSection } from './task-custom-fields-section';
import { TaskDealsSection } from './task-deals-section';
import { TaskRelationsSection } from './task-relations-section';
import { TaskSubtasksSection } from './task-subtasks-section';
import { TaskTagsSection } from './task-tags-section';

interface TaskDetailDrawerProps {
  workspaceId: string;
  task: BoardTask;
  columnName: string;
  relationCandidates: TaskRelationCandidate[];
  linkSource?: 'board' | 'all-tasks' | 'my-tasks';
  onOpenTask: (taskId: string) => void;
  onClose: () => void;
}

export function TaskDetailDrawer({
  workspaceId,
  task,
  columnName,
  relationCandidates,
  linkSource = 'board',
  onOpenTask,
  onClose,
}: TaskDetailDrawerProps) {
  const { data: session } = useMeQuery();
  const { data: members = [] } = useMembersQuery(workspaceId);
  const updateMutation = useUpdateTaskMutation(workspaceId);
  const deleteMutation = useDeleteTaskMutation(workspaceId);
  const duplicateMutation = useDuplicateTaskMutation(workspaceId);
  const { data: fullTask } = useTaskDetailQuery(workspaceId, task.id);
  const detailTask = fullTask ?? task;
  const { data: comments = [], isLoading: commentsLoading } = useCommentsQuery(
    workspaceId,
    task.id,
  );
  const createCommentMutation = useCreateCommentMutation(workspaceId, task.id);
  const deleteCommentMutation = useDeleteCommentMutation(workspaceId, task.id);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<TaskPriority | ''>(task.priority ?? '');
  const [complexity, setComplexity] = useState<number | ''>(task.complexity ?? '');
  const [timeEstimateMinutes, setTimeEstimateMinutes] = useState<number | ''>(
    task.timeEstimateMinutes ?? '',
  );
  const [actualMinutes, setActualMinutes] = useState<number | ''>(task.actualMinutes ?? '');
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? '');
  const [recurrenceRule, setRecurrenceRule] = useState<TaskRecurrenceRule>(task.recurrenceRule);
  const [recurrenceAction, setRecurrenceAction] = useState<TaskRecurrenceAction>(
    task.recurrenceAction,
  );
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>(
    task.recurrenceWeekdays ?? [],
  );
  const [commentBody, setCommentBody] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setTitle(detailTask.title);
    setDescription(detailTask.description ?? '');
    setPriority(detailTask.priority ?? '');
    setComplexity(detailTask.complexity ?? '');
    setTimeEstimateMinutes(detailTask.timeEstimateMinutes ?? '');
    setActualMinutes(detailTask.actualMinutes ?? '');
    setDueDate(toDateInputValue(detailTask.dueDate));
    setAssigneeId(detailTask.assigneeId ?? '');
    setRecurrenceRule(detailTask.recurrenceRule);
    setRecurrenceAction(detailTask.recurrenceAction);
    setRecurrenceWeekdays(detailTask.recurrenceWeekdays ?? []);
  }, [detailTask]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    await updateMutation.mutateAsync({
      taskId: task.id,
      data: {
        title: title.trim(),
        description: description.trim() || null,
        priority: priority || null,
        complexity: complexity === '' ? null : Number(complexity),
        timeEstimateMinutes: timeEstimateMinutes === '' ? null : Number(timeEstimateMinutes),
        actualMinutes: actualMinutes === '' ? null : Number(actualMinutes),
        dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
        assigneeId: assigneeId || null,
        recurrenceRule,
        recurrenceAction,
        recurrenceWeekdays: recurrenceRule === 'WEEKLY' ? recurrenceWeekdays : [],
        recurrenceOriginColumnId:
          recurrenceRule === 'NONE' ? null : (task.recurrenceOriginColumnId ?? task.columnId),
      },
    });
    onClose();
  };

  const toggleWeekday = (day: number) => {
    setRecurrenceWeekdays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort(),
    );
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(task.id);
    onClose();
  };

  const handleDuplicate = async () => {
    const copy = await duplicateMutation.mutateAsync(task.id);
    if (copy?.id) {
      onOpenTask(copy.id);
    }
  };

  const handleCopyLink = async () => {
    await copyTaskLink(task.id, linkSource);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentBody.trim()) return;
    await createCommentMutation.mutateAsync(commentBody.trim());
    setCommentBody('');
  };

  return (
    <div className="task-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="task-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Редактирование задачи"
      >
        <div className="task-drawer__header">
          <div>
            <p className="task-drawer__eyebrow">{columnName}</p>
            <h2 className="task-drawer__heading">Задача</h2>
          </div>
          <button
            type="button"
            className="dashboard-header__icon-btn"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-drawer__form">
          <label className="task-drawer__field">
            <span>Название</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="glass-input"
              required
              maxLength={200}
              autoFocus
            />
          </label>

          <label className="task-drawer__field">
            <span>Описание</span>
            <MentionTextarea
              value={description}
              onChange={setDescription}
              members={members}
              className="glass-input task-drawer__textarea"
              rows={4}
              maxLength={2000}
              placeholder="Подробности задачи… Введите @, чтобы упомянуть коллегу"
            />
          </label>

          <label className="task-drawer__field">
            <span>Исполнитель</span>
            <select
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="glass-input"
            >
              <option value="">Не назначен</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </label>

          <div className="task-drawer__grid">
            <label className="task-drawer__field">
              <span>Приоритет</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority | '')}
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
              <span>Сложность</span>
              <select
                value={complexity}
                onChange={(event) =>
                  setComplexity(event.target.value === '' ? '' : Number(event.target.value))
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
              <span>Оценка времени</span>
              <select
                value={timeEstimateMinutes}
                onChange={(event) =>
                  setTimeEstimateMinutes(
                    event.target.value === '' ? '' : Number(event.target.value),
                  )
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
              <span>Фактическое время</span>
              <select
                value={actualMinutes}
                onChange={(event) =>
                  setActualMinutes(event.target.value === '' ? '' : Number(event.target.value))
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
            <span>Дедлайн</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="glass-input"
            />
          </label>

          <div className="task-drawer__recurrence">
            <h3 className="task-drawer__recurrence-title">Повторение</h3>
            <p className="task-drawer__recurrence-hint">
              При переносе в «Готово» задача автоматически создастся снова или перенесётся на
              следующий срок.
            </p>

            <label className="task-drawer__field">
              <span>Частота</span>
              <select
                value={recurrenceRule}
                onChange={(event) => {
                  const nextRule = event.target.value as TaskRecurrenceRule;
                  setRecurrenceRule(nextRule);
                  if (nextRule !== 'WEEKLY') {
                    setRecurrenceWeekdays([]);
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
                <span>Дни недели</span>
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
                <span>После выполнения</span>
                <select
                  value={recurrenceAction}
                  onChange={(event) =>
                    setRecurrenceAction(event.target.value as TaskRecurrenceAction)
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

          {updateMutation.error ? (
            <p className="text-sm text-red-400">{updateMutation.error.message}</p>
          ) : null}

          <div className="task-drawer__actions">
            <button type="button" onClick={handleCopyLink} className="btn-ghost">
              {linkCopied ? 'Ссылка скопирована' : 'Копировать ссылку'}
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={duplicateMutation.isPending}
              className="btn-ghost"
            >
              {duplicateMutation.isPending ? 'Копирование...' : 'Дублировать'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn-ghost task-drawer__danger"
            >
              Удалить
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !title.trim()}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>

        <TaskTagsSection workspaceId={workspaceId} taskId={task.id} selected={task.tags ?? []} />

        <TaskSubtasksSection workspaceId={workspaceId} taskId={task.id} />

        <TaskAttachmentsSection workspaceId={workspaceId} taskId={task.id} />

        <TaskCustomFieldsSection
          workspaceId={workspaceId}
          taskId={task.id}
          values={task.customFields}
        />

        <TaskRelationsSection
          workspaceId={workspaceId}
          taskId={task.id}
          candidates={relationCandidates}
          onOpenTask={onOpenTask}
        />

        <TaskDealsSection workspaceId={workspaceId} taskId={task.id} />

        <div className="task-drawer__comments">
          <h3 className="task-drawer__comments-title">Комментарии</h3>

          {commentsLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет комментариев</p>
          ) : (
            <ul className="task-drawer__comments-list">
              {comments.map((comment) => (
                <li key={comment.id} className="task-drawer__comment">
                  <div className="task-drawer__comment-head">
                    <span className="task-drawer__comment-author">{comment.author.name}</span>
                    <span className="task-drawer__comment-date">
                      {new Date(comment.createdAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {(comment.authorId === session?.user.id ||
                      members.find((m) => m.userId === session?.user.id)?.role === 'OWNER' ||
                      members.find((m) => m.userId === session?.user.id)?.role === 'ADMIN') && (
                      <button
                        type="button"
                        className="task-drawer__comment-delete"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        aria-label="Удалить комментарий"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p className="task-drawer__comment-body">
                    <MentionText text={comment.body} members={members} />
                  </p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddComment} className="task-drawer__comment-form">
            <MentionTextarea
              value={commentBody}
              onChange={setCommentBody}
              members={members}
              className="glass-input task-drawer__textarea"
              rows={2}
              maxLength={2000}
              placeholder="Комментарий… Введите @ для упоминания"
              aria-label="Новый комментарий"
            />
            <button
              type="submit"
              disabled={!commentBody.trim() || createCommentMutation.isPending}
              className="btn-ghost"
            >
              Отправить
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

function toDateInputValue(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}
