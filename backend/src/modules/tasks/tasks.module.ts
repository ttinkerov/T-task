import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { DodModule } from '../dod/dod.module';
import { MentionsModule } from '../mentions/mentions.module';
import { TemplatesModule } from '../templates/templates.module';
import { WatchersModule } from '../watchers/watchers.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AllTasksController } from './all-tasks.controller';
import { AllTasksService } from './all-tasks.service';
import { MyTasksController } from './my-tasks.controller';
import { CustomFieldsController, TaskCustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './custom-fields.service';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';
import { TagsController, TaskTagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TaskRelationsController } from './task-relations.controller';
import { TaskRelationsService } from './task-relations.service';
import { TaskAttachmentsController } from './task-attachments.controller';
import { TaskAttachmentsService } from './task-attachments.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    WorkspacesModule,
    BoardsModule,
    MentionsModule,
    WatchersModule,
    DodModule,
    TemplatesModule,
  ],
  controllers: [
    TasksController,
    TaskRelationsController,
    CustomFieldsController,
    TaskCustomFieldsController,
    AllTasksController,
    MyTasksController,
    TagsController,
    TaskTagsController,
    SubtasksController,
    TaskAttachmentsController,
  ],
  providers: [
    TasksService,
    TaskRelationsService,
    CustomFieldsService,
    AllTasksService,
    TagsService,
    SubtasksService,
    TaskAttachmentsService,
  ],
  exports: [
    TasksService,
    TaskRelationsService,
    CustomFieldsService,
    TagsService,
    SubtasksService,
    TaskAttachmentsService,
  ],
})
export class TasksModule {}
