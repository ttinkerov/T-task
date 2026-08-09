import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { BoardsController, WorkspaceBoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { OutboundWebhookService } from './outbound-webhook.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [BoardsController, WorkspaceBoardsController],
  providers: [BoardsService, OutboundWebhookService],
  exports: [BoardsService, OutboundWebhookService],
})
export class BoardsModule {}
