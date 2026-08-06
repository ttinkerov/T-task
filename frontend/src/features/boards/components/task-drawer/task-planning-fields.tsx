'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EpicAiBreakdown } from '@/features/ai/components/epic-ai-breakdown';
import { useSprintsQuery } from '@/features/sprints';
import { boardKeys, invalidateWorkspaceBoards } from '../../hooks';
import type { BoardTask, BoardView, TaskRelationCandidate } from '../../types';
import { FieldHint } from '../field-hint';

export function TaskPlanningFields({
  workspaceId,
  task,
  relationCandidates,
  sprintId,
  epicId,
  isEpic,
  onSprintChange,
  onEpicChange,
  onIsEpicChange,
}: {
  workspaceId: string;
  task: BoardTask;
  relationCandidates: TaskRelationCandidate[];
  sprintId: string;
  epicId: string;
  isEpic: boolean;
  onSprintChange: (id: string) => void;
  onEpicChange: (id: string) => void;
  onIsEpicChange: (value: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: sprints = [] } = useSprintsQuery(workspaceId);
  const cachedBoard = queryClient.getQueryData<BoardView>(boardKeys.detail(workspaceId, 'default'));
  const epicOptions = useMemo(() => {
    const fromCandidates = relationCandidates.filter(
      (candidate) => candidate.isEpic && candidate.id !== task.id,
    );
    if (fromCandidates.length > 0) {
      return fromCandidates.map((candidate) => ({ id: candidate.id, title: candidate.title }));
    }
    return (cachedBoard?.columns.flatMap((column) => column.tasks) ?? [])
      .filter((item) => item.isEpic && item.id !== task.id)
      .map((item) => ({ id: item.id, title: item.title }));
  }, [cachedBoard, relationCandidates, task.id]);

  return (
    <div className="task-drawer__grid">
      <label className="task-drawer__field">
        <span className="task-drawer__label">
          Спринт
          <FieldHint text="Короткий рабочий цикл (обычно 1–2 недели), в который входит задача." />
        </span>
        <select
          value={sprintId}
          onChange={(event) => onSprintChange(event.target.value)}
          className="glass-input"
        >
          <option value="">Без спринта</option>
          {sprints
            .filter((sprint) => !sprint.closedAt || sprint.id === sprintId)
            .map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
        </select>
      </label>

      <label className="task-drawer__field">
        <span className="task-drawer__label">
          Эпик
          <FieldHint text="Крупная цель. Задачу можно вложить в эпик или отметить саму как эпик." />
        </span>
        <select
          value={isEpic ? '' : epicId}
          onChange={(event) => onEpicChange(event.target.value)}
          className="glass-input"
          disabled={isEpic}
        >
          <option value="">Без эпика</option>
          {epicOptions.map((epic) => (
            <option key={epic.id} value={epic.id}>
              {epic.title}
            </option>
          ))}
        </select>
        <label className="forms-editor__checkbox" style={{ marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            checked={isEpic}
            onChange={(event) => {
              onIsEpicChange(event.target.checked);
              if (event.target.checked) onEpicChange('');
            }}
          />
          Это эпик
        </label>
        {task.isEpic ? (
          <EpicAiBreakdown
            workspaceId={workspaceId}
            epicId={task.id}
            onApplied={() => {
              invalidateWorkspaceBoards(queryClient, workspaceId);
              void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
            }}
          />
        ) : null}
      </label>
    </div>
  );
}
