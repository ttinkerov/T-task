-- Deduplicate due-reminder notifications per task+recipient (race on concurrent inbox polls).
CREATE UNIQUE INDEX IF NOT EXISTS notifications_due_reminder_dedup_key
  ON notifications (task_id, recipient_id)
  WHERE type = 'DUE_REMINDER';
