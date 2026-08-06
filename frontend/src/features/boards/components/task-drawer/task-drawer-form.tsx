'use client';

import { FormEvent } from 'react';
import { TaskAiAssistant } from '@/features/ai/components/task-ai-assistant';
import { TaskDescriptionEditor } from '@/features/task-description';
import { WikiLinkChips } from '@/features/wiki-links/components/wiki-link-chips';
import { useMembersQuery } from '@/features/workspaces/hooks';
import type { BoardTask, TaskRelationCandidate } from '../../types';
import type { useTaskFormState } from './hooks/use-task-form-state';
import { TaskAssigneeWatchFields } from './task-assignee-watch-fields';
import { TaskDrawerActions } from './task-drawer-actions';
import { TaskEstimationFields } from './task-estimation-fields';
import { TaskPlanningFields } from './task-planning-fields';
import { TaskRecurrenceFields } from './task-recurrence-fields';

type FormState = ReturnType<typeof useTaskFormState>;

export function TaskDrawerForm({
  workspaceId,
  task,
  relationCandidates,
  linkSource,
  form,
  isSaving,
  saveError,
  onSubmit,
  onOpenTask,
  onClose,
}: {
  workspaceId: string;
  task: BoardTask;
  relationCandidates: TaskRelationCandidate[];
  linkSource: 'board' | 'all-tasks' | 'my-tasks';
  form: FormState;
  isSaving: boolean;
  saveError: string | null | undefined;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOpenTask: (taskId: string) => void;
  onClose: () => void;
}) {
  const { data: members = [] } = useMembersQuery(workspaceId);
  const wikiLinkTasks = relationCandidates.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    columnName: candidate.columnName,
  }));

  return (
    <form onSubmit={onSubmit} className="task-drawer__form">
      <label className="task-drawer__field">
        <span className="task-drawer__label">Название</span>
        <input
          value={form.title}
          onChange={(event) => form.setTitle(event.target.value)}
          className="glass-input"
          required
          maxLength={200}
          autoFocus
        />
      </label>

      <div className="task-drawer__field">
        <span className="task-drawer__label">Описание</span>
        <TaskDescriptionEditor
          value={form.descriptionDoc}
          onChange={form.setDescriptionDoc}
          members={members}
          wikiLinkTasks={wikiLinkTasks}
          excludeWikiTaskId={task.id}
        />
        <WikiLinkChips text={form.description} excludeTaskId={task.id} onOpenTask={onOpenTask} />
      </div>

      <TaskAiAssistant
        workspaceId={workspaceId}
        taskTitle={form.title}
        taskDescription={form.description}
      />

      <TaskAssigneeWatchFields
        workspaceId={workspaceId}
        taskId={task.id}
        assigneeId={form.assigneeId}
        onAssigneeChange={form.setAssigneeId}
      />

      <TaskPlanningFields
        workspaceId={workspaceId}
        task={task}
        relationCandidates={relationCandidates}
        sprintId={form.sprintId}
        epicId={form.epicId}
        isEpic={form.isEpic}
        onSprintChange={form.setSprintId}
        onEpicChange={form.setEpicId}
        onIsEpicChange={form.setIsEpic}
      />

      <TaskEstimationFields
        priority={form.priority}
        complexity={form.complexity}
        timeEstimateMinutes={form.timeEstimateMinutes}
        actualMinutes={form.actualMinutes}
        dueDate={form.dueDate}
        onPriorityChange={form.setPriority}
        onComplexityChange={form.setComplexity}
        onTimeEstimateChange={form.setTimeEstimateMinutes}
        onActualMinutesChange={form.setActualMinutes}
        onDueDateChange={form.setDueDate}
      />

      <TaskRecurrenceFields
        recurrenceRule={form.recurrenceRule}
        recurrenceAction={form.recurrenceAction}
        recurrenceWeekdays={form.recurrenceWeekdays}
        onRecurrenceRuleChange={form.setRecurrenceRule}
        onRecurrenceActionChange={form.setRecurrenceAction}
        onRecurrenceWeekdaysChange={form.setRecurrenceWeekdays}
      />

      <TaskDrawerActions
        workspaceId={workspaceId}
        taskId={task.id}
        linkSource={linkSource}
        title={form.title}
        isSaving={isSaving}
        saveError={saveError}
        onOpenTask={onOpenTask}
        onClose={onClose}
      />
    </form>
  );
}
