import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import {
  CalendarFeedsController,
  PublicCalendarFeedsController,
} from './calendar-feeds.controller';
import { CalendarFeedsService } from './calendar-feeds.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [CalendarFeedsController, PublicCalendarFeedsController],
  providers: [CalendarFeedsService],
})
export class CalendarModule {}
