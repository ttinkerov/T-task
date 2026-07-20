-- AlterTable
ALTER TABLE "workspace_members" ADD COLUMN IF NOT EXISTS "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[];
