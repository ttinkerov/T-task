'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import { useMembersQuery } from '@/features/workspaces/hooks';
import {
  useCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '../hooks';
import {
  COMPLEXITY_OPTIONS,
  PRIORITY_OPTIONS,
  TIME_ESTIMATE_OPTIONS,
  type BoardTask,
  type TaskPriority,
} from '../types';

interface TaskDetailDrawerProps {
  workspaceId: string;
  task: BoardTask;
  columnName: string;
  onClose: () => void;
}

export function TaskDetailDrawer({
  workspaceId,
  task,
  columnName,
  onClose,
}: TaskDetailDrawerProps) {
  const { data: session } = useMeQuery();
  const { data: members = [] } = useMembersQuery(workspaceId);
  const updateMutation = useUpdateTaskMutation(workspaceId);
  const deleteMutation = useDeleteTaskMutation(workspaceId);
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
  const [commentBody, setCommentBody] = useState('');

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority ?? '');
    setComplexity(task.complexity ?? '');
    setTimeEstimateMinutes(task.timeEstimateMinutes ?? '');
    setActualMinutes(task.actualMinutes ?? '');
    setDueDate(toDateInputValue(task.dueDate));
    setAssigneeId(task.assigneeId ?? '');
  }, [task]);

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
      },
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(task.id);
    onClose();
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
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="glass-input task-drawer__textarea"
              rows={4}
              maxLength={2000}
              placeholder="Подробности задачи..."
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

          {updateMutation.error ? (
            <p className="text-sm text-red-400">{updateMutation.error.message}</p>
          ) : null}

          <div className="task-drawer__actions">
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
                  <p className="task-drawer__comment-body">{comment.body}</p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddComment} className="task-drawer__comment-form">
            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              className="glass-input task-drawer__textarea"
              rows={2}
              maxLength={2000}
              placeholder="Написать комментарий..."
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
