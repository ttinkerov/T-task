'use client';

import { TaskAttachmentsSection } from '@/features/attachments';
import { TaskChecklistSection } from '@/features/dod';
import { ApplyTaskTemplateControl } from '@/features/templates';
import { LazyMount } from '@/shared/ui/lazy-mount';
import type { BoardTask, TaskRelationCandidate, TaskTag } from '../../types';
import { TaskCustomFieldsSection } from '../task-custom-fields-section';
import { TaskDealsSection } from '../task-deals-section';
import { TaskRelationsSection } from '../task-relations-section';
import { TaskRollupSection } from '../task-rollup-section';
import { TaskSubtasksSection } from '../task-subtasks-section';
import { TaskTagsSection } from '../task-tags-section';

const EMPTY_TAGS: TaskTag[] = [];

export function TaskDrawerSections({
  workspaceId,
  task,
  detailTask,
  relationCandidates,
  onOpenTask,
}: {
  workspaceId: string;
  task: BoardTask;
  detailTask: BoardTask;
  relationCandidates: TaskRelationCandidate[];
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <>
      <ApplyTaskTemplateControl workspaceId={workspaceId} taskId={task.id} />

      <TaskTagsSection
        workspaceId={workspaceId}
        taskId={task.id}
        selected={detailTask.tags ?? task.tags ?? EMPTY_TAGS}
      />

      <LazyMount eagerMs={150}>
        <TaskSubtasksSection workspaceId={workspaceId} taskId={task.id} />
        <TaskChecklistSection workspaceId={workspaceId} taskId={task.id} />
        <TaskAttachmentsSection workspaceId={workspaceId} taskId={task.id} />
        <TaskCustomFieldsSection
          workspaceId={workspaceId}
          taskId={task.id}
          values={task.customFields}
        />
        <TaskRollupSection workspaceId={workspaceId} taskId={task.id} />
        <TaskRelationsSection
          workspaceId={workspaceId}
          taskId={task.id}
          candidates={relationCandidates}
          onOpenTask={onOpenTask}
        />
        <TaskDealsSection workspaceId={workspaceId} taskId={task.id} />
      </LazyMount>
    </>
  );
}
