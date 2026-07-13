-- CreateEnum
CREATE TYPE "TeamSize" AS ENUM ('SOLO', 'SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "WorkspaceUseCase" AS ENUM ('DEVELOPMENT', 'DESIGN', 'MARKETING', 'PRODUCT', 'OPERATIONS', 'OTHER');

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "team_size" "TeamSize";
ALTER TABLE "workspaces" ADD COLUMN "use_cases" "WorkspaceUseCase"[] NOT NULL DEFAULT ARRAY[]::"WorkspaceUseCase"[];

-- AlterTable boards: add workspace_id, backfill, drop project_id
ALTER TABLE "boards" ADD COLUMN "workspace_id" TEXT;

UPDATE "boards" b
SET "workspace_id" = p."workspace_id"
FROM "projects" p
WHERE b."project_id" = p."id";

ALTER TABLE "boards" ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "boards" ADD CONSTRAINT "boards_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "boards_workspace_id_idx" ON "boards"("workspace_id");

ALTER TABLE "boards" DROP CONSTRAINT IF EXISTS "boards_project_id_fkey";
ALTER TABLE "boards" DROP COLUMN "project_id";

-- DropTable
DROP TABLE "projects";
