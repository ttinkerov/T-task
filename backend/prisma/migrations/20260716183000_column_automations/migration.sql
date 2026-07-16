CREATE TYPE "ColumnAutomationAction" AS ENUM (
  'ASSIGN_USER',
  'START_TIMER',
  'COMPLETE_TASK'
);

ALTER TABLE "tasks"
  ADD COLUMN "timer_started_at" TIMESTAMP(3),
  ADD COLUMN "completed_at" TIMESTAMP(3);

CREATE TABLE "column_automations" (
  "id" TEXT NOT NULL,
  "column_id" TEXT NOT NULL,
  "action" "ColumnAutomationAction" NOT NULL,
  "assignee_id" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "column_automations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "column_automations_column_id_action_key"
  ON "column_automations"("column_id", "action");
CREATE INDEX "column_automations_column_id_idx"
  ON "column_automations"("column_id");
CREATE INDEX "column_automations_assignee_id_idx"
  ON "column_automations"("assignee_id");

ALTER TABLE "column_automations"
  ADD CONSTRAINT "column_automations_column_id_fkey"
  FOREIGN KEY ("column_id") REFERENCES "board_columns"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "column_automations"
  ADD CONSTRAINT "column_automations_assignee_id_fkey"
  FOREIGN KEY ("assignee_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
