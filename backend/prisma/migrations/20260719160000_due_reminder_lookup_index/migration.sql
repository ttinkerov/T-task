-- Speeds due-reminder background scans (assignee + due window + not yet sent).
CREATE INDEX IF NOT EXISTS tasks_due_reminder_lookup_idx
  ON tasks (assignee_id, due_date)
  WHERE deleted_at IS NULL
    AND completed_at IS NULL
    AND due_reminder_sent_at IS NULL;
