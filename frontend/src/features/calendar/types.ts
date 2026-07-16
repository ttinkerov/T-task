export interface CalendarFeedStatus {
  enabled: boolean;
  tokenPrefix: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CalendarFeedCreated extends CalendarFeedStatus {
  feedPath: string;
}
