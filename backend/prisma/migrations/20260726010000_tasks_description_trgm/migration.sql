-- Enable description search in workspace Quick Switcher (⌘K).
CREATE INDEX IF NOT EXISTS tasks_description_trgm_idx
  ON tasks USING gin (description gin_trgm_ops);
