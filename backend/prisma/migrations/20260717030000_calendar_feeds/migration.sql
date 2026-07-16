CREATE TABLE "calendar_feeds" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "calendar_feeds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "calendar_feeds_token_hash_key" ON "calendar_feeds"("token_hash");
CREATE UNIQUE INDEX "calendar_feeds_workspace_id_user_id_key"
    ON "calendar_feeds"("workspace_id", "user_id");
CREATE INDEX "calendar_feeds_user_id_idx" ON "calendar_feeds"("user_id");

ALTER TABLE "calendar_feeds"
    ADD CONSTRAINT "calendar_feeds_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calendar_feeds"
    ADD CONSTRAINT "calendar_feeds_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
