export const DomainEvents = {
  TASK_MOVED: 'task.moved',
  TASK_ASSIGNED: 'task.assigned',
  COMMENT_CREATED: 'comment.created',
  INVITATION_CREATED: 'invitation.created',
  MENTION_CREATED: 'mention.created',
  DUE_REMINDER: 'due.reminder',
} as const;

export type DomainEventName = (typeof DomainEvents)[keyof typeof DomainEvents];

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

export type CommentCreatedPayload = {
  workspaceId: string;
  boardId: string;
  taskId: string;
  commentId: string;
  actorId: string;
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
