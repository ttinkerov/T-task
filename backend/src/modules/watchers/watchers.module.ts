import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WatchersController } from './watchers.controller';
import { WatchersService } from './watchers.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [WatchersController],
  providers: [WatchersService],
  exports: [WatchersService],
})
export class WatchersModule {}
