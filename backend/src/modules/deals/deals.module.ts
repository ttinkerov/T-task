import { Module } from '@nestjs/common';
import { FunnelsModule } from '../funnels/funnels.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [WorkspacesModule, FunnelsModule],
  controllers: [DealsController],
  providers: [DealsService],
})
export class DealsModule {}
