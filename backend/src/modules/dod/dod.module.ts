import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DodTemplatesController } from './dod-templates.controller';
import { DodTemplatesService } from './dod-templates.service';
import { TaskChecklistController } from './task-checklist.controller';
import { TaskChecklistService } from './task-checklist.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [DodTemplatesController, TaskChecklistController],
  providers: [DodTemplatesService, TaskChecklistService],
  exports: [DodTemplatesService, TaskChecklistService],
})
export class DodModule {}
