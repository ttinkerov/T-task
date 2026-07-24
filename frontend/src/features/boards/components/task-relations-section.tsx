'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  useCreateTaskRelationMutation,
  useDeleteTaskRelationMutation,
  useTaskRelationsQuery,
} from '../hooks';
import type { TaskRelationCandidate, TaskRelationType } from '../types';
import { FieldHint } from './field-hint';

const RELATION_OPTIONS: Array<{
  value: TaskRelationType;
  label: string;
  hint: string;
}> = [
  {
    value: 'BLOCKS',
    label: 'Блокирует',
    hint: 'Эту задачу нужно завершить первой',
  },
  {
    value: 'WAITING_FOR',
    label: 'Ожидает',
    hint: 'Эту задачу нельзя завершить раньше выбранной',
  },
  {
    value: 'RELATES_TO',
    label: 'Связана',
    hint: 'Задачи связаны, но не блокируют друг друга',
  },
];

const RELATION_LABELS: Record<TaskRelationType, string> = {
  BLOCKS: 'Блокирует',
  WAITING_FOR: 'Ожидает',
  RELATES_TO: 'Связана',
};

const RELATION_ICONS: Record<TaskRelationType, string> = {
  BLOCKS: '→',
  WAITING_FOR: '←',
  RELATES_TO: '↔',
};

interface TaskRelationsSectionProps {
  workspaceId: string;
  taskId: string;
  candidates: TaskRelationCandidate[];
  onOpenTask: (taskId: string) => void;
}

export function TaskRelationsSection({
  workspaceId,
  taskId,
  candidates,
  onOpenTask,
}: TaskRelationsSectionProps) {
  const relationsQuery = useTaskRelationsQuery(workspaceId, taskId);
  const createMutation = useCreateTaskRelationMutation(workspaceId, taskId);
  const deleteMutation = useDeleteTaskRelationMutation(workspaceId, taskId);
  const [type, setType] = useState<TaskRelationType>('WAITING_FOR');
  const [relatedTaskId, setRelatedTaskId] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const relations = relationsQuery.data ?? [];
  const availableCandidates = useMemo(() => {
    const relatedIds = new Set(relations.map((relation) => relation.task.id));
    return candidates.filter(
      (candidate) => candidate.id !== taskId && !relatedIds.has(candidate.id),
    );
  }, [candidates, relations, taskId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!relatedTaskId) {
      return;
    }

    try {
      await createMutation.mutateAsync({ type, relatedTaskId });
      setRelatedTaskId('');
    } catch {
      return;
    }
  };

  const handleDelete = async (relationId: string, relatedTaskIdToDelete: string) => {
    setDeletingId(relationId);
    try {
      await deleteMutation.mutateAsync({
        relationId,
        relatedTaskId: relatedTaskIdToDelete,
      });
    } catch {
      return;
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="task-relations" aria-labelledby="task-relations-title">
      <div className="task-relations__heading">
        <div>
          <h3 id="task-relations-title" className="task-drawer__section-title">
            Связи
            <FieldHint text="Зависимости между задачами: блокирует, ожидает или просто связана." />
          </h3>
          <p>Покажите порядок выполнения и зависимость между задачами.</p>
        </div>
        <span>{relations.length}</span>
      </div>

      {relationsQuery.isLoading ? (
        <p className="task-relations__empty" role="status">
          Загружаем связи…
        </p>
      ) : relationsQuery.error ? (
        <p className="task-relations__error" role="alert">
          Не удалось загрузить связи.
        </p>
      ) : relations.length === 0 ? (
        <p className="task-relations__empty">У задачи пока нет связей</p>
      ) : (
        <ul className="task-relations__list">
          {relations.map((relation) => (
            <li key={relation.id}>
              <span
                className={`task-relations__icon task-relations__icon--${relation.type.toLowerCase()}`}
                aria-hidden="true"
              >
                {RELATION_ICONS[relation.type]}
              </span>
              <button
                type="button"
                className="task-relations__task"
                onClick={() => onOpenTask(relation.task.id)}
              >
                <span>{RELATION_LABELS[relation.type]}</span>
                <strong>{relation.task.title}</strong>
                <small>
                  {relation.task.columnName}
                  {relation.task.completed ? ' · выполнена' : ''}
                </small>
              </button>
              <button
                type="button"
                className="task-relations__delete"
                onClick={() => void handleDelete(relation.id, relation.task.id)}
                disabled={deletingId === relation.id}
                aria-label={`Удалить связь с задачей «${relation.task.title}»`}
              >
                {deletingId === relation.id ? '…' : '×'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="task-relations__form" onSubmit={handleSubmit}>
        <label>
          <span>Тип связи</span>
          <select
            className="glass-input"
            value={type}
            onChange={(event) => setType(event.target.value as TaskRelationType)}
          >
            {RELATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Задача</span>
          <select
            className="glass-input"
            value={relatedTaskId}
            onChange={(event) => setRelatedTaskId(event.target.value)}
          >
            <option value="">Выберите задачу</option>
            {availableCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title} · {candidate.columnName}
              </option>
            ))}
          </select>
        </label>
        <p>{RELATION_OPTIONS.find((option) => option.value === type)?.hint}</p>
        <button
          type="submit"
          className="btn-ghost"
          disabled={!relatedTaskId || createMutation.isPending}
        >
          {createMutation.isPending ? 'Добавляем…' : 'Добавить связь'}
        </button>
      </form>

      {createMutation.error || deleteMutation.error ? (
        <p className="task-relations__error" role="alert">
          {createMutation.error?.message ??
            deleteMutation.error?.message ??
            'Не удалось изменить связь.'}
        </p>
      ) : null}
    </section>
  );
}
