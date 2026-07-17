-- Replace nullable unique (recipient_id, comment_id): PostgreSQL treats NULLs as
-- distinct, so description mentions never deduped and the constraint was misleading.
DROP INDEX IF EXISTS "notifications_recipient_id_comment_id_key";

CREATE UNIQUE INDEX "notifications_recipient_id_comment_id_key"
    ON "notifications"("recipient_id", "comment_id")
    WHERE "comment_id" IS NOT NULL;

CREATE INDEX "notifications_recipient_id_comment_id_idx"
    ON "notifications"("recipient_id", "comment_id");
