'use client';

import { ApplyTaskTemplateControl } from '@/features/templates/components/apply-task-template-control';
import { LazyMount } from '@/shared/ui/lazy-mount';
import type { BoardTask, TaskRelationCandidate, TaskTag } from '../../types';
import { TaskAttachmentsSection } from '@/features/attachments/components/task-attachments-section';
import { TaskChecklistSection } from '@/features/dod/components/task-checklist-section';
import { TaskBacklinksSection } from '../task-backlinks-section';
import { TaskCustomFieldsSection } from '../task-custom-fields-section';
import { TaskDealsSection } from '../task-deals-section';
import { TaskRelationsSection } from '../task-relations-section';
import { TaskRollupSection } from '../task-rollup-section';
import { TaskSubtasksSection } from '../task-subtasks-section';
import { TaskTagsSection } from '../task-tags-section';

const EMPTY_TAGS: TaskTag[] = [];
const EMPTY_CUSTOM_FIELDS: BoardTask['customFields'] = [];

export function TaskDrawerSections({
  workspaceId,
  boardId,
  task,
  detailTask,
  relationCandidates,
  onOpenTask,
}: {
  workspaceId: string;
  boardId?: string | null;
  task: BoardTask;
  detailTask: BoardTask;
  relationCandidates: TaskRelationCandidate[];
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <>
      <ApplyTaskTemplateControl workspaceId={workspaceId} taskId={task.id} />

      <LazyMount eagerMs={150}>
        <TaskTagsSection
          workspaceId={workspaceId}
          taskId={task.id}
          boardId={boardId}
          selected={detailTask.tags ?? task.tags ?? EMPTY_TAGS}
        />
        <TaskSubtasksSection workspaceId={workspaceId} taskId={task.id} boardId={boardId} />
        <TaskChecklistSection workspaceId={workspaceId} taskId={task.id} boardId={boardId} />
        <TaskAttachmentsSection workspaceId={workspaceId} taskId={task.id} />

        <details className="task-drawer__more">
          <summary>Дополнительно</summary>
          <div className="task-drawer__more-body">
            <TaskCustomFieldsSection
              workspaceId={workspaceId}
              taskId={task.id}
              values={task.customFields ?? EMPTY_CUSTOM_FIELDS}
            />
            <TaskRollupSection workspaceId={workspaceId} taskId={task.id} />
            <TaskRelationsSection
              workspaceId={workspaceId}
              taskId={task.id}
              candidates={relationCandidates}
              onOpenTask={onOpenTask}
            />
            <TaskBacklinksSection
              workspaceId={workspaceId}
              taskId={task.id}
              onOpenTask={onOpenTask}
            />
            <TaskDealsSection workspaceId={workspaceId} taskId={task.id} />
          </div>
        </details>
      </LazyMount>
    </>
  );
}
