export type NotificationType = 'MENTION' | 'DUE_REMINDER';
export type NotificationSourceType = 'TASK_DESCRIPTION' | 'COMMENT';

export interface NotificationActor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  sourceType: NotificationSourceType | null;
  preview: string;
  read: boolean;
  createdAt: string;
  task: {
    id: string;
    title: string;
  };
  actor: NotificationActor | null;
}

/** @deprecated Use AppNotification */
export type MentionNotification = AppNotification;

export interface NotificationInbox {
  items: AppNotification[];
  unreadCount: number;
}
