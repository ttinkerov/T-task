import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DealTemplatesController } from './deal-templates.controller';
import { DealTemplatesService } from './deal-templates.service';
import { TaskTemplatesController } from './task-templates.controller';
import { TaskTemplatesService } from './task-templates.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [TaskTemplatesController, DealTemplatesController],
  providers: [TaskTemplatesService, DealTemplatesService],
  exports: [TaskTemplatesService, DealTemplatesService],
})
export class TemplatesModule {}
