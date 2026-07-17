CREATE TYPE "NotificationType" AS ENUM ('MENTION');
CREATE TYPE "MentionSourceType" AS ENUM ('TASK_DESCRIPTION', 'COMMENT');

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "comment_id" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'MENTION',
    "source_type" "MentionSourceType" NOT NULL,
    "preview" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_recipient_id_comment_id_key"
    ON "notifications"("recipient_id", "comment_id");
CREATE INDEX "notifications_workspace_id_recipient_id_read_at_created_at_idx"
    ON "notifications"("workspace_id", "recipient_id", "read_at", "created_at");
CREATE INDEX "notifications_task_id_idx" ON "notifications"("task_id");

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey"
    FOREIGN KEY ("recipient_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_comment_id_fkey"
    FOREIGN KEY ("comment_id") REFERENCES "comments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
