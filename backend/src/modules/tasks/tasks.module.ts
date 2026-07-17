import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { MentionsModule } from '../mentions/mentions.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CustomFieldsController, TaskCustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './custom-fields.service';
import { TaskRelationsController } from './task-relations.controller';
import { TaskRelationsService } from './task-relations.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [WorkspacesModule, BoardsModule, MentionsModule],
  controllers: [
    TasksController,
    TaskRelationsController,
    CustomFieldsController,
    TaskCustomFieldsController,
  ],
  providers: [TasksService, TaskRelationsService, CustomFieldsService],
  exports: [TasksService, TaskRelationsService, CustomFieldsService],
})
export class TasksModule {}
