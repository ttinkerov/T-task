-- Hot-path Task indexes for analytics, overdue filters, stuck tasks, and board scans.
CREATE INDEX IF NOT EXISTS "tasks_column_id_deleted_at_idx" ON "tasks"("column_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "tasks_due_date_idx" ON "tasks"("due_date");
CREATE INDEX IF NOT EXISTS "tasks_completed_at_idx" ON "tasks"("completed_at");
CREATE INDEX IF NOT EXISTS "tasks_updated_at_idx" ON "tasks"("updated_at");
