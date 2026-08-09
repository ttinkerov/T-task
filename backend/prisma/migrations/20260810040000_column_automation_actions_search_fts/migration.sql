ALTER TYPE "ColumnAutomationAction" ADD VALUE IF NOT EXISTS 'NOTIFY_WATCHERS';
ALTER TYPE "ColumnAutomationAction" ADD VALUE IF NOT EXISTS 'SET_CUSTOM_FIELD';
ALTER TYPE "ColumnAutomationAction" ADD VALUE IF NOT EXISTS 'WEBHOOK';

ALTER TABLE "column_automations" ADD COLUMN IF NOT EXISTS "config" JSONB;

CREATE INDEX IF NOT EXISTS "tasks_fts_idx"
  ON "tasks"
  USING gin (to_tsvector('russian', coalesce("title", '') || ' ' || coalesce("description", '')));

CREATE INDEX IF NOT EXISTS "deals_fts_idx"
  ON "deals"
  USING gin (to_tsvector('russian', coalesce("title", '')));

CREATE INDEX IF NOT EXISTS "comments_fts_idx"
  ON "comments"
  USING gin (to_tsvector('russian', coalesce("body", '')));
