import { Module } from '@nestjs/common';
import { SecurityModule } from './common/security/security.module';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { IdentityModule } from './modules/identity/identity.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { BoardsModule } from './modules/boards/boards.module';
import { FunnelsModule } from './modules/funnels/funnels.module';
import { DealsModule } from './modules/deals/deals.module';
import { FormsModule } from './modules/forms/forms.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityModule } from './modules/activity/activity.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AppsModule } from './modules/apps/apps.module';
import { TrashModule } from './modules/trash/trash.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    AppConfigModule,
    SecurityModule,
    PrismaModule,
    RedisModule,
    IdentityModule,
    WorkspacesModule,
    BoardsModule,
    FunnelsModule,
    DealsModule,
    FormsModule,
    TasksModule,
    CommentsModule,
    NotificationsModule,
    ActivityModule,
    RealtimeModule,
    AppsModule,
    TrashModule,
    CalendarModule,
  ],
})
export class AppModule {}
