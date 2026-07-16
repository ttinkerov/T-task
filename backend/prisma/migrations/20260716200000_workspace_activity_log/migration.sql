CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "entity_name" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_logs_workspace_id_created_at_idx"
ON "activity_logs"("workspace_id", "created_at" DESC);

CREATE INDEX "activity_logs_actor_id_idx" ON "activity_logs"("actor_id");

CREATE INDEX "activity_logs_workspace_id_action_idx"
ON "activity_logs"("workspace_id", "action");

ALTER TABLE "activity_logs"
ADD CONSTRAINT "activity_logs_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_activity_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'activity_logs rows are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_logs_immutable_update
BEFORE UPDATE ON "activity_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_activity_log_mutation();

CREATE TRIGGER activity_logs_immutable_delete
BEFORE DELETE ON "activity_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_activity_log_mutation();
