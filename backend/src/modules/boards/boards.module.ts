import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { BoardsController, WorkspaceBoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [BoardsController, WorkspaceBoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
