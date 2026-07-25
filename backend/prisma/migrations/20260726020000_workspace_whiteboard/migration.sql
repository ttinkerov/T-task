-- CreateTable
CREATE TABLE "workspace_whiteboards" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_whiteboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_whiteboards_workspace_id_key" ON "workspace_whiteboards"("workspace_id");

-- CreateIndex
CREATE INDEX "workspace_whiteboards_updated_by_id_idx" ON "workspace_whiteboards"("updated_by_id");

-- AddForeignKey
ALTER TABLE "workspace_whiteboards" ADD CONSTRAINT "workspace_whiteboards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_whiteboards" ADD CONSTRAINT "workspace_whiteboards_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
