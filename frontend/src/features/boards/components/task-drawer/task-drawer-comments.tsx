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
  const { data: members = [] } = useMembersQuery(workspaceId);
  const { data: comments = [], isLoading: commentsLoading } = useCommentsQuery(workspaceId, taskId);
  const createCommentMutation = useCreateCommentMutation(workspaceId, taskId);
  const deleteCommentMutation = useDeleteCommentMutation(workspaceId, taskId);
  const [commentBody, setCommentBody] = useState('');

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

  const onSubmit = useCallback(async () => {
    if (!commentBody.trim()) return;
    await createCommentMutation.mutateAsync(commentBody.trim());
    setCommentBody('');
  }, [commentBody, createCommentMutation]);

  const onDelete = useCallback(
    (commentId: string) => {
      deleteCommentMutation.mutate(commentId);
    },
    [deleteCommentMutation],
  );

  const viewProps = useMemo(
    () => ({
      loading: commentsLoading,
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
    }),
    [
      commentsLoading,
      commentItems,
      memberOptions,
      commentBody,
      createCommentMutation.isPending,
      listboxId,
      onSubmit,
      onDelete,
    ],
  );

  return <VueIsland component={TaskDrawerCommentsView} componentProps={viewProps} />;
}
