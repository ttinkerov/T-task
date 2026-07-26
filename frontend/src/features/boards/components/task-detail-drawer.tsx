'use client';

import { FormEvent } from 'react';
import { useTaskDetailQuery, useUpdateTaskMutation } from '../hooks';
import { buildTaskUpdatePayload } from '../lib/task-form-values';
import type { BoardTask, TaskRelationCandidate } from '../types';
import { useDrawerEscapeClose } from './task-drawer/hooks/use-drawer-escape-close';
import { useTaskDrawerShortcuts } from './task-drawer/hooks/use-task-drawer-shortcuts';
import { useTaskFormState } from './task-drawer/hooks/use-task-form-state';
import { TaskDrawerComments } from './task-drawer/task-drawer-comments';
import { TaskDrawerForm } from './task-drawer/task-drawer-form';
import { TaskDrawerHeader } from './task-drawer/task-drawer-header';
import { TaskDrawerSections } from './task-drawer/task-drawer-sections';

interface TaskDetailDrawerProps {
  workspaceId: string;
  boardId?: string | null;
  task: BoardTask;
  columnName: string;
  relationCandidates: TaskRelationCandidate[];
  linkSource?: 'board' | 'all-tasks' | 'my-tasks';
  onOpenTask: (taskId: string) => void;
  onClose: () => void;
}

export function TaskDetailDrawer({
  workspaceId,
  boardId,
  task,
  columnName,
  relationCandidates,
  linkSource = 'board',
  onOpenTask,
  onClose,
}: TaskDetailDrawerProps) {
  const resolvedBoardId = boardId ?? (isTaskWithBoard(task) ? task.board.id : null);
  const updateMutation = useUpdateTaskMutation(workspaceId, resolvedBoardId);
  const { data: fullTask } = useTaskDetailQuery(workspaceId, task.id);
  const detailTask = fullTask ?? task;
  const form = useTaskFormState(detailTask);

  useDrawerEscapeClose(onClose);
  useTaskDrawerShortcuts({
    setAssigneeId: form.setAssigneeId,
    assignMe: (userId) =>
      updateMutation.mutateAsync({
        taskId: task.id,
        data: { assigneeId: userId },
      }),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    await updateMutation.mutateAsync({
      taskId: task.id,
      data: buildTaskUpdatePayload(form, task),
    });
    onClose();
  };

  return (
    <div className="task-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="task-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Редактирование задачи"
        data-testid="task-detail-drawer"
      >
        <TaskDrawerHeader columnName={columnName} onClose={onClose} />

        <div className="task-drawer__body">
          <TaskDrawerForm
            workspaceId={workspaceId}
            task={task}
            relationCandidates={relationCandidates}
            linkSource={linkSource}
            form={form}
            isSaving={updateMutation.isPending}
            saveError={updateMutation.error?.message}
            onSubmit={handleSubmit}
            onOpenTask={onOpenTask}
            onClose={onClose}
          />

          <TaskDrawerSections
            workspaceId={workspaceId}
            boardId={resolvedBoardId}
            task={task}
            detailTask={detailTask}
            relationCandidates={relationCandidates}
            onOpenTask={onOpenTask}
          />

          <TaskDrawerComments workspaceId={workspaceId} taskId={task.id} />
        </div>
      </aside>
    </div>
  );
}

function isTaskWithBoard(task: BoardTask): task is BoardTask & { board: { id: string } } {
  return (
    'board' in task &&
    typeof (task as { board?: unknown }).board === 'object' &&
    (task as { board?: { id?: unknown } }).board !== null &&
    typeof (task as { board: { id?: unknown } }).board.id === 'string'
  );
}
