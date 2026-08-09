CREATE TYPE "RagSourceType" AS ENUM ('TASK', 'COMMENT');

CREATE TABLE "rag_chunks" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_type" "RagSourceType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[] NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rag_chunks_source_type_source_id_chunk_index_key"
ON "rag_chunks"("source_type", "source_id", "chunk_index");

CREATE INDEX "rag_chunks_workspace_id_idx" ON "rag_chunks"("workspace_id");

CREATE INDEX "rag_chunks_workspace_id_source_type_source_id_idx"
ON "rag_chunks"("workspace_id", "source_type", "source_id");

ALTER TABLE "rag_chunks"
ADD CONSTRAINT "rag_chunks_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
