import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { FunnelsController } from './funnels.controller';
import { FunnelsService } from './funnels.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [FunnelsController],
  providers: [FunnelsService],
  exports: [FunnelsService],
})
export class FunnelsModule {}
