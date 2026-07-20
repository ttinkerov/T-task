-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('OPENAI', 'OPENROUTER', 'GROQ', 'CUSTOM');

-- CreateTable
CREATE TABLE "ai_workspace_settings" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL DEFAULT 'OPENAI',
    "base_url" TEXT,
    "model" TEXT NOT NULL,
    "token_ciphertext" TEXT NOT NULL,
    "token_iv" TEXT NOT NULL,
    "token_auth_tag" TEXT NOT NULL,
    "token_last4" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_workspace_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_workspace_settings_workspace_id_key" ON "ai_workspace_settings"("workspace_id");

-- AddForeignKey
ALTER TABLE "ai_workspace_settings" ADD CONSTRAINT "ai_workspace_settings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
