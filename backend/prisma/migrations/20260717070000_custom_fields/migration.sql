CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'CHECKBOX', 'SELECT', 'MULTI_SELECT', 'URL', 'USER');

CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "show_on_card" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "custom_field_definitions_workspace_id_idx" ON "custom_field_definitions"("workspace_id");

CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_field_values_field_id_task_id_key" ON "custom_field_values"("field_id", "task_id");
CREATE INDEX "custom_field_values_task_id_idx" ON "custom_field_values"("task_id");

ALTER TABLE "custom_field_definitions"
    ADD CONSTRAINT "custom_field_definitions_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "custom_field_values"
    ADD CONSTRAINT "custom_field_values_field_id_fkey"
    FOREIGN KEY ("field_id") REFERENCES "custom_field_definitions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "custom_field_values"
    ADD CONSTRAINT "custom_field_values_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
