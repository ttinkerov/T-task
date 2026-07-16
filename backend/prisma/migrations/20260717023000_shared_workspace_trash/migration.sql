-- Soft-delete support for shared workspace trash (Task, Deal, App)
-- Parent containers keep nullable deletedAt for orphan restore checks.

ALTER TABLE "board_columns" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "funnel_stages" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "workspace_external_apps" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "tasks_deleted_at_idx" ON "tasks"("deleted_at");
CREATE INDEX "deals_deleted_at_idx" ON "deals"("deleted_at");
CREATE INDEX "workspace_external_apps_workspace_id_deleted_at_idx"
  ON "workspace_external_apps"("workspace_id", "deleted_at");

-- Allow re-adding an app URL after the previous instance was trashed.
DROP INDEX IF EXISTS "workspace_external_apps_workspace_id_source_url_key";
CREATE UNIQUE INDEX "workspace_external_apps_workspace_id_source_url_key"
  ON "workspace_external_apps"("workspace_id", "source_url")
  WHERE "deleted_at" IS NULL;
