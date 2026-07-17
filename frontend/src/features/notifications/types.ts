export interface MentionNotification {
  id: string;
  type: 'MENTION';
  sourceType: 'TASK_DESCRIPTION' | 'COMMENT';
  preview: string;
  read: boolean;
  createdAt: string;
  task: {
    id: string;
    title: string;
  };
  actor: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface NotificationInbox {
  items: MentionNotification[];
  unreadCount: number;
}
