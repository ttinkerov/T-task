import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WhiteboardController } from './whiteboard.controller';
import { WhiteboardService } from './whiteboard.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [WhiteboardController],
  providers: [WhiteboardService],
})
export class WhiteboardModule {}
