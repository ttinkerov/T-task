CREATE TYPE "TaskRelationType" AS ENUM ('BLOCKS', 'RELATES_TO');

CREATE TABLE "task_relations" (
    "id" TEXT NOT NULL,
    "source_task_id" TEXT NOT NULL,
    "target_task_id" TEXT NOT NULL,
    "pair_key" TEXT NOT NULL,
    "type" "TaskRelationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_relations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_relations_no_self_link" CHECK ("source_task_id" <> "target_task_id")
);

CREATE UNIQUE INDEX "task_relations_pair_key_key" ON "task_relations"("pair_key");
CREATE INDEX "task_relations_source_task_id_idx" ON "task_relations"("source_task_id");
CREATE INDEX "task_relations_target_task_id_idx" ON "task_relations"("target_task_id");

ALTER TABLE "task_relations"
    ADD CONSTRAINT "task_relations_source_task_id_fkey"
    FOREIGN KEY ("source_task_id") REFERENCES "tasks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_relations"
    ADD CONSTRAINT "task_relations_target_task_id_fkey"
    FOREIGN KEY ("target_task_id") REFERENCES "tasks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
