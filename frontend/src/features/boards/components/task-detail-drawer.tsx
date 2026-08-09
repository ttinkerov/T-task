'use client';

import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskDetailDrawerView from '@/vue/boards/TaskDetailDrawerView.vue';
import { useTaskDetailQuery, useUpdateTaskMutation } from '../hooks';
import { buildTaskUpdatePayload } from '../lib/task-form-values';
import type { BoardTask, TaskRelationCandidate } from '../types';
import { useDrawerEscapeClose } from './task-drawer/hooks/use-drawer-escape-close';
import { useTaskDrawerShortcuts } from './task-drawer/hooks/use-task-drawer-shortcuts';
import { useTaskFormState } from './task-drawer/hooks/use-task-form-state';
import { TaskDrawerComments } from './task-drawer/task-drawer-comments';
import { TaskDrawerForm } from './task-drawer/task-drawer-form';
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
  const [hosts, setHosts] = useState<{
    form: HTMLElement | null;
    sections: HTMLElement | null;
    comments: HTMLElement | null;
  }>({ form: null, sections: null, comments: null });

  useDrawerEscapeClose(onClose);
  useTaskDrawerShortcuts({
    setAssigneeId: form.setAssigneeId,
    assignMe: (userId) =>
      updateMutation.mutateAsync({
        taskId: task.id,
        data: { assigneeId: userId },
      }),
  });

  const onHostsReady = useCallback(
    (next: {
      form: HTMLElement | null;
      sections: HTMLElement | null;
      comments: HTMLElement | null;
    }) => {
      setHosts(next);
    },
    [],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    await updateMutation.mutateAsync({
      taskId: task.id,
      data: buildTaskUpdatePayload(form, task),
    });
    onClose();
  };

  const viewProps = useMemo(
    () => ({
      columnName,
      onClose,
      onHostsReady,
    }),
    [columnName, onClose, onHostsReady],
  );

  return (
    <>
      <VueIsland component={TaskDetailDrawerView} componentProps={viewProps} />
      {hosts.form
        ? createPortal(
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
            />,
            hosts.form,
          )
        : null}
      {hosts.sections
        ? createPortal(
            <TaskDrawerSections
              workspaceId={workspaceId}
              boardId={resolvedBoardId}
              task={task}
              detailTask={detailTask}
              relationCandidates={relationCandidates}
              onOpenTask={onOpenTask}
            />,
            hosts.sections,
          )
        : null}
      {hosts.comments
        ? createPortal(
            <TaskDrawerComments workspaceId={workspaceId} taskId={task.id} />,
            hosts.comments,
          )
        : null}
    </>
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
