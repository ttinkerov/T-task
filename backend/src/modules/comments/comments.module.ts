import { Module } from '@nestjs/common';
import { MentionsModule } from '../mentions/mentions.module';
import { WatchersModule } from '../watchers/watchers.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [WorkspacesModule, MentionsModule, WatchersModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
