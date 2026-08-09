-- Separate embedding credentials for RAG (chat can use any provider).

ALTER TABLE "ai_workspace_settings"
ADD COLUMN "embedding_provider" "AiProvider",
ADD COLUMN "embedding_base_url" TEXT,
ADD COLUMN "embedding_model" TEXT,
ADD COLUMN "embedding_token_ciphertext" TEXT,
ADD COLUMN "embedding_token_iv" TEXT,
ADD COLUMN "embedding_token_auth_tag" TEXT,
ADD COLUMN "embedding_token_last4" TEXT;
