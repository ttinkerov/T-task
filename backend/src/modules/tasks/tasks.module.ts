import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { MentionsModule } from '../mentions/mentions.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AllTasksController } from './all-tasks.controller';
import { AllTasksService } from './all-tasks.service';
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
    AllTasksController,
  ],
  providers: [TasksService, TaskRelationsService, CustomFieldsService, AllTasksService],
  exports: [TasksService, TaskRelationsService, CustomFieldsService],
})
export class TasksModule {}
