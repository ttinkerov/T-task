'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import { findWikiLinkTrigger, insertWikiLink } from '@/features/wiki-links/wiki-link-utils';
import { useMembersQuery } from '@/features/workspaces/hooks';
import TaskDrawerCommentsView from '@/vue/boards/TaskDrawerComments.vue';
import { useCommentsQuery, useCreateCommentMutation, useDeleteCommentMutation } from '../../hooks';
import {
  findMentionTrigger,
  insertMention,
  tokenizeMentions,
} from '@/features/mentions/mention-utils';

export function TaskDrawerComments({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const listboxId = useId();
  const { data: session } = useMeQuery();
  const membersQuery = useMembersQuery(workspaceId);
  const members = membersQuery.data ?? [];
  const {
    data: comments = [],
    isLoading: commentsLoading,
    isError: commentsError,
    error: commentsLoadError,
    refetch,
  } = useCommentsQuery(workspaceId, taskId);
  const createCommentMutation = useCreateCommentMutation(workspaceId, taskId);
  const deleteCommentMutation = useDeleteCommentMutation(workspaceId, taskId);
  const [commentBody, setCommentBody] = useState('');
  const [actionError, setActionError] = useState('');

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
      })),
    [members],
  );

  const namesById = useMemo(
    () => new Map(members.map((member) => [member.userId, member.user.name])),
    [members],
  );

  const currentMember = useMemo(
    () => members.find((member) => member.userId === session?.user.id),
    [members, session?.user.id],
  );

  const canModerate = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';

  const commentItems = useMemo(
    () =>
      comments.map((comment) => ({
        id: comment.id,
        authorName: comment.author.name,
        dateLabel: new Date(comment.createdAt).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        canDelete: comment.authorId === session?.user.id || canModerate,
        tokens: tokenizeMentions(comment.body).map((token, index) => {
          if (token.type === 'text') {
            return {
              key: `t-${index}-${token.value.slice(0, 8)}`,
              kind: 'text' as const,
              value: token.value,
            };
          }
          const currentName = namesById.get(token.userId);
          return {
            key: `m-${index}-${token.userId}`,
            kind: currentName ? ('mention' as const) : ('text' as const),
            value: currentName ? `@${currentName}` : token.value,
          };
        }),
      })),
    [canModerate, comments, namesById, session?.user.id],
  );

  const loadError =
    commentsError || membersQuery.isError
      ? commentsError
        ? commentsLoadError instanceof Error
          ? commentsLoadError.message
          : 'Не удалось загрузить комментарии'
        : membersQuery.error instanceof Error
          ? membersQuery.error.message
          : 'Не удалось загрузить участников'
      : '';

  const onRetryLoad = useCallback(() => {
    void refetch();
    void membersQuery.refetch();
  }, [membersQuery, refetch]);

  const onSubmit = useCallback(async () => {
    if (!commentBody.trim()) return;
    setActionError('');
    try {
      await createCommentMutation.mutateAsync(commentBody.trim());
      setCommentBody('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось отправить комментарий');
    }
  }, [commentBody, createCommentMutation]);

  const onDelete = useCallback(
    async (commentId: string) => {
      setActionError('');
      try {
        await deleteCommentMutation.mutateAsync(commentId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось удалить комментарий');
      }
    },
    [deleteCommentMutation],
  );

  const viewProps = useMemo(
    () => ({
      loading: commentsLoading,
      loadError,
      actionError,
      comments: commentItems,
      members: memberOptions,
      commentBody,
      canSubmit: Boolean(commentBody.trim()),
      submitPending: createCommentMutation.isPending,
      listboxId,
      findMentionTrigger,
      findWikiLinkTrigger,
      insertMention,
      insertWikiLink,
      onCommentBodyChange: setCommentBody,
      onSubmit,
      onDelete,
      onRetryLoad,
    }),
    [
      commentsLoading,
      loadError,
      actionError,
      commentItems,
      memberOptions,
      commentBody,
      createCommentMutation.isPending,
      listboxId,
      onSubmit,
      onDelete,
      onRetryLoad,
    ],
  );

  return <VueIsland component={TaskDrawerCommentsView} componentProps={viewProps} />;
}
