import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { MentionsModule } from '../mentions/mentions.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AllTasksController } from './all-tasks.controller';
import { AllTasksService } from './all-tasks.service';
import { CustomFieldsController, TaskCustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './custom-fields.service';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';
import { TagsController, TaskTagsController } from './tags.controller';
import { TagsService } from './tags.service';
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
    TagsController,
    TaskTagsController,
    SubtasksController,
  ],
  providers: [
    TasksService,
    TaskRelationsService,
    CustomFieldsService,
    AllTasksService,
    TagsService,
    SubtasksService,
  ],
  exports: [TasksService, TaskRelationsService, CustomFieldsService, TagsService, SubtasksService],
})
export class TasksModule {}
