import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AiCredentialsService } from './ai-credentials.service';
import { AiProviderClient } from './ai-provider.client';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RagChunkStore } from './rag/rag-chunk.store';
import { RagIndexListener } from './rag/rag-index.listener';
import { RagIndexerService } from './rag/rag-indexer.service';
import { RagRetrieverService } from './rag/rag-retriever.service';

@Module({
  imports: [WorkspacesModule, AnalyticsModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiProviderClient,
    AiCredentialsService,
    RagChunkStore,
    RagIndexerService,
    RagRetrieverService,
    RagIndexListener,
  ],
  exports: [RagIndexerService],
})
export class AiModule {}
