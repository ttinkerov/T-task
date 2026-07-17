import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TaskRelationsController } from './task-relations.controller';
import { TaskRelationsService } from './task-relations.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [WorkspacesModule, BoardsModule],
  controllers: [TasksController, TaskRelationsController],
  providers: [TasksService, TaskRelationsService],
  exports: [TasksService, TaskRelationsService],
})
export class TasksModule {}
