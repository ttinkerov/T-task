import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [AppsController],
  providers: [AppsService],
})
export class AppsModule {}
