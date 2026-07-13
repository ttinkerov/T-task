import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [WorkspacesModule, BoardsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
