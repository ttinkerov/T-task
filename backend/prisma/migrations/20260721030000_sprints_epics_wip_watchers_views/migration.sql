-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WATCH';

-- AlterTable
ALTER TABLE "board_columns" ADD COLUMN "wip_limit" INTEGER;

-- AlterTable
ALTER TABLE "saved_filters" ADD COLUMN "is_shared" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "saved_filters" ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "sprint_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN "is_epic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN "epic_id" TEXT;

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_watchers" (
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_watchers_pkey" PRIMARY KEY ("task_id","user_id")
);

-- CreateIndex
CREATE INDEX "sprints_workspace_id_idx" ON "sprints"("workspace_id");
CREATE INDEX "task_watchers_user_id_idx" ON "task_watchers"("user_id");
CREATE INDEX "tasks_sprint_id_idx" ON "tasks"("sprint_id");
CREATE INDEX "tasks_epic_id_idx" ON "tasks"("epic_id");
CREATE INDEX "saved_filters_workspace_id_is_shared_idx" ON "saved_filters"("workspace_id", "is_shared");

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_epic_id_fkey" FOREIGN KEY ("epic_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_watchers" ADD CONSTRAINT "task_watchers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_watchers" ADD CONSTRAINT "task_watchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
