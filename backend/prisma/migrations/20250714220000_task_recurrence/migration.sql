-- Task recurrence (Weeek-style repeatable tasks)
CREATE TYPE "TaskRecurrenceRule" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
CREATE TYPE "TaskRecurrenceAction" AS ENUM ('DUPLICATE', 'RESCHEDULE');

ALTER TABLE "tasks"
  ADD COLUMN "recurrence_rule" "TaskRecurrenceRule" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "recurrence_action" "TaskRecurrenceAction" NOT NULL DEFAULT 'DUPLICATE',
  ADD COLUMN "recurrence_weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN "recurrence_origin_column_id" TEXT;
