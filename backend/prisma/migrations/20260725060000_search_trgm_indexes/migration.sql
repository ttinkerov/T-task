-- Speed up ILIKE / contains searches on titles and comment bodies.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS tasks_title_trgm_idx ON tasks USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS deals_title_trgm_idx ON deals USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS comments_body_trgm_idx ON comments USING gin (body gin_trgm_ops);
