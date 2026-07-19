import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DueRemindersService } from './due-reminders.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, DueRemindersService],
  exports: [NotificationsService, DueRemindersService],
})
export class NotificationsModule {}
