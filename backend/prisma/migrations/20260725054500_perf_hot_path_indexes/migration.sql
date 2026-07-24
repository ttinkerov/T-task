-- CreateIndex
CREATE INDEX "board_columns_board_id_deleted_at_idx" ON "board_columns"("board_id", "deleted_at");

-- CreateIndex
CREATE INDEX "tasks_column_id_deleted_at_position_idx" ON "tasks"("column_id", "deleted_at", "position");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_due_date_idx" ON "tasks"("assignee_id", "due_date");

-- CreateIndex
CREATE INDEX "deals_stage_id_deleted_at_position_idx" ON "deals"("stage_id", "deleted_at", "position");
