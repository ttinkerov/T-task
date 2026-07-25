import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SecurityModule } from './common/security/security.module';
import { AppConfigModule } from './config/config.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { MailNotificationsListener } from './infrastructure/mail/mail-notifications.listener';
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
import { FiltersModule } from './modules/filters/filters.module';
import { SearchModule } from './modules/search/search.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ExportModule } from './modules/export/export.module';
import { AiModule } from './modules/ai/ai.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { WatchersModule } from './modules/watchers/watchers.module';
import { DodModule } from './modules/dod/dod.module';
import { ImportModule } from './modules/import/import.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: false }),
    AppConfigModule,
    SecurityModule,
    PrismaModule,
    RedisModule,
    MailModule,
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
    FiltersModule,
    SearchModule,
    AnalyticsModule,
    ExportModule,
    AiModule,
    SprintsModule,
    WatchersModule,
    DodModule,
    TemplatesModule,
    ImportModule,
  ],
  controllers: [HealthController],
  providers: [MailNotificationsListener],
})
export class AppModule {}
