import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RagSourceType } from '@prisma/client';
import {
  CommentCreatedPayload,
  CommentDeletedPayload,
  DomainEvents,
  TaskChangedPayload,
  TaskSoftDeletedPayload,
} from '../../../common/events/domain-events';
import { RagIndexerService } from './rag-indexer.service';

@Injectable()
export class RagIndexListener {
  constructor(private readonly indexer: RagIndexerService) {}

  @OnEvent(DomainEvents.TASK_CHANGED)
  handleTaskChanged(payload: TaskChangedPayload) {
    this.indexer.scheduleUpsertTask(payload.workspaceId, payload.taskId);
  }

  @OnEvent(DomainEvents.TASK_SOFT_DELETED)
  handleTaskSoftDeleted(payload: TaskSoftDeletedPayload) {
    this.indexer.scheduleDeleteTaskIndex(payload.workspaceId, payload.taskId);
  }

  @OnEvent(DomainEvents.COMMENT_CREATED)
  handleCommentCreated(payload: CommentCreatedPayload) {
    this.indexer.scheduleUpsertComment(payload.workspaceId, payload.commentId);
  }

  @OnEvent(DomainEvents.COMMENT_DELETED)
  handleCommentDeleted(payload: CommentDeletedPayload) {
    this.indexer.scheduleDeleteSource(
      payload.workspaceId,
      RagSourceType.COMMENT,
      payload.commentId,
    );
  }
}
