import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AiProviderClient } from './ai-provider.client';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [AiController],
  providers: [AiService, AiProviderClient],
})
export class AiModule {}
