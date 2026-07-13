-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "priority" "TaskPriority";
ALTER TABLE "tasks" ADD COLUMN "complexity" INTEGER;
ALTER TABLE "tasks" ADD COLUMN "due_date" TIMESTAMP(3);
