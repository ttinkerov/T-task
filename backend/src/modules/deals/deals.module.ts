import { Module } from '@nestjs/common';
import { FunnelsModule } from '../funnels/funnels.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DealTasksController } from './deal-tasks.controller';
import { DealTasksService } from './deal-tasks.service';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { TaskDealsController } from './task-deals.controller';

@Module({
  imports: [WorkspacesModule, FunnelsModule],
  controllers: [DealsController, DealTasksController, TaskDealsController],
  providers: [DealsService, DealTasksService],
  exports: [DealTasksService],
})
export class DealsModule {}
