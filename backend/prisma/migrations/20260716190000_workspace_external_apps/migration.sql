CREATE TYPE "ExternalAppProvider" AS ENUM (
  'GOOGLE_DOCS',
  'GOOGLE_SHEETS',
  'FIGMA',
  'MIRO',
  'AIRTABLE'
);

CREATE TABLE "workspace_external_apps" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "created_by_id" TEXT,
  "provider" "ExternalAppProvider" NOT NULL,
  "title" TEXT NOT NULL,
  "source_url" TEXT NOT NULL,
  "embed_url" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "workspace_external_apps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_external_apps_workspace_id_source_url_key"
  ON "workspace_external_apps"("workspace_id", "source_url");
CREATE INDEX "workspace_external_apps_workspace_id_idx"
  ON "workspace_external_apps"("workspace_id");
CREATE INDEX "workspace_external_apps_created_by_id_idx"
  ON "workspace_external_apps"("created_by_id");

ALTER TABLE "workspace_external_apps"
  ADD CONSTRAINT "workspace_external_apps_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_external_apps"
  ADD CONSTRAINT "workspace_external_apps_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
