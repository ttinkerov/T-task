'use client';

import { FormEvent, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import { MentionText, MentionTextarea } from '@/features/mentions';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { useCommentsQuery, useCreateCommentMutation, useDeleteCommentMutation } from '../../hooks';
import { FieldHint } from '../field-hint';

export function TaskDrawerComments({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const { data: session } = useMeQuery();
  const { data: members = [] } = useMembersQuery(workspaceId);
  const { data: comments = [], isLoading: commentsLoading } = useCommentsQuery(workspaceId, taskId);
  const createCommentMutation = useCreateCommentMutation(workspaceId, taskId);
  const deleteCommentMutation = useDeleteCommentMutation(workspaceId, taskId);
  const [commentBody, setCommentBody] = useState('');

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentBody.trim()) return;
    await createCommentMutation.mutateAsync(commentBody.trim());
    setCommentBody('');
  };

  return (
    <div className="task-drawer__comments">
      <h3 className="task-drawer__comments-title task-drawer__section-title">
        Комментарии
        <FieldHint text="Обсуждение по задаче. Можно упоминать участников через @." />
      </h3>

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
          id="task-comment-input"
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
  );
}
