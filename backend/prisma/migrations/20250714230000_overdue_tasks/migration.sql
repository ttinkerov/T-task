ALTER TABLE "workspaces"
  ADD COLUMN "auto_roll_overdue" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "tasks"
  ADD COLUMN "overdue_days" INTEGER NOT NULL DEFAULT 0;
