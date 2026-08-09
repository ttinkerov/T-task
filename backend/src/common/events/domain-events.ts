export const DomainEvents = {
  TASK_MOVED: 'task.moved',
  TASK_ASSIGNED: 'task.assigned',
  TASK_CHANGED: 'task.changed',
  TASK_SOFT_DELETED: 'task.soft_deleted',
  COMMENT_CREATED: 'comment.created',
  COMMENT_DELETED: 'comment.deleted',
  INVITATION_CREATED: 'invitation.created',
  MENTION_CREATED: 'mention.created',
  DUE_REMINDER: 'due.reminder',
  USER_ACCESS_REVOKED: 'user.access.revoked',
  WORKSPACE_MEMBER_REMOVED: 'workspace.member.removed',
} as const;

export type DomainEventName = (typeof DomainEvents)[keyof typeof DomainEvents];

export type UserAccessRevokedPayload = {
  userId: string;
};

export type WorkspaceMemberRemovedPayload = {
  userId: string;
  workspaceId: string;
};

export type TaskMovedPayload = {
  workspaceId: string;
  boardId: string;
  taskId: string;
  columnId: string;
  position: number;
  actorId: string;
};

export type TaskAssignedPayload = {
  workspaceId: string;
  boardId: string;
  taskId: string;
  assigneeId: string | null;
  actorId: string;
};

export type TaskChangedPayload = {
  workspaceId: string;
  taskId: string;
};

export type TaskSoftDeletedPayload = {
  workspaceId: string;
  taskId: string;
};

export type CommentCreatedPayload = {
  workspaceId: string;
  boardId: string;
  taskId: string;
  commentId: string;
  actorId: string;
};

export type CommentDeletedPayload = {
  workspaceId: string;
  commentId: string;
};

export type InvitationCreatedPayload = {
  workspaceId: string;
  workspaceName: string;
  invitationId: string;
  email: string;
  role: string;
  token: string;
  inviterName: string;
};

export type MentionCreatedPayload = {
  workspaceId: string;
  taskId: string;
  recipientEmail: string;
  recipientName: string;
  actorName: string;
  preview: string;
};

export type DueReminderPayload = {
  workspaceId: string;
  taskId: string;
  taskTitle: string;
  recipientEmail: string;
  recipientName: string;
  dueDate: string;
};
