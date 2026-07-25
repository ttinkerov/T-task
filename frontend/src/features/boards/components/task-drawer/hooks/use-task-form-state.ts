'use client';

import { useEffect, useState } from 'react';
import {
  hydrateDescriptionDoc,
  plainTextFromDescriptionDoc,
  type DescriptionDoc,
} from '@/features/task-description';
import { toDateInputValue } from '../../../lib/task-form-values';
import type {
  BoardTask,
  TaskPriority,
  TaskRecurrenceAction,
  TaskRecurrenceRule,
} from '../../../types';

const EMPTY_WEEKDAYS: number[] = [];

export function useTaskFormState(detailTask: BoardTask) {
  const [title, setTitle] = useState(detailTask.title);
  const [descriptionDoc, setDescriptionDoc] = useState<DescriptionDoc>(() =>
    hydrateDescriptionDoc(detailTask.descriptionDoc, detailTask.description),
  );
  const [priority, setPriority] = useState<TaskPriority | ''>(detailTask.priority ?? '');
  const [complexity, setComplexity] = useState<number | ''>(detailTask.complexity ?? '');
  const [timeEstimateMinutes, setTimeEstimateMinutes] = useState<number | ''>(
    detailTask.timeEstimateMinutes ?? '',
  );
  const [actualMinutes, setActualMinutes] = useState<number | ''>(detailTask.actualMinutes ?? '');
  const [dueDate, setDueDate] = useState(toDateInputValue(detailTask.dueDate));
  const [assigneeId, setAssigneeId] = useState(detailTask.assigneeId ?? '');
  const [sprintId, setSprintId] = useState(detailTask.sprintId ?? '');
  const [epicId, setEpicId] = useState(detailTask.epicId ?? '');
  const [isEpic, setIsEpic] = useState(Boolean(detailTask.isEpic));
  const [recurrenceRule, setRecurrenceRule] = useState<TaskRecurrenceRule>(
    detailTask.recurrenceRule,
  );
  const [recurrenceAction, setRecurrenceAction] = useState<TaskRecurrenceAction>(
    detailTask.recurrenceAction,
  );
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>(
    detailTask.recurrenceWeekdays ?? EMPTY_WEEKDAYS,
  );

  useEffect(() => {
    setTitle(detailTask.title);
    setDescriptionDoc(hydrateDescriptionDoc(detailTask.descriptionDoc, detailTask.description));
    setPriority(detailTask.priority ?? '');
    setComplexity(detailTask.complexity ?? '');
    setTimeEstimateMinutes(detailTask.timeEstimateMinutes ?? '');
    setActualMinutes(detailTask.actualMinutes ?? '');
    setDueDate(toDateInputValue(detailTask.dueDate));
    setAssigneeId(detailTask.assigneeId ?? '');
    setSprintId(detailTask.sprintId ?? '');
    setEpicId(detailTask.epicId ?? '');
    setIsEpic(Boolean(detailTask.isEpic));
    setRecurrenceRule(detailTask.recurrenceRule);
    setRecurrenceAction(detailTask.recurrenceAction);
    setRecurrenceWeekdays(detailTask.recurrenceWeekdays ?? EMPTY_WEEKDAYS);
  }, [
    detailTask.id,
    detailTask.title,
    detailTask.description,
    detailTask.descriptionDoc,
    detailTask.priority,
    detailTask.complexity,
    detailTask.timeEstimateMinutes,
    detailTask.actualMinutes,
    detailTask.dueDate,
    detailTask.assigneeId,
    detailTask.sprintId,
    detailTask.epicId,
    detailTask.isEpic,
    detailTask.recurrenceRule,
    detailTask.recurrenceAction,
    detailTask.recurrenceWeekdays,
  ]);

  const description = plainTextFromDescriptionDoc(descriptionDoc);

  return {
    title,
    setTitle,
    description,
    descriptionDoc,
    setDescriptionDoc,
    priority,
    setPriority,
    complexity,
    setComplexity,
    timeEstimateMinutes,
    setTimeEstimateMinutes,
    actualMinutes,
    setActualMinutes,
    dueDate,
    setDueDate,
    assigneeId,
    setAssigneeId,
    sprintId,
    setSprintId,
    epicId,
    setEpicId,
    isEpic,
    setIsEpic,
    recurrenceRule,
    setRecurrenceRule,
    recurrenceAction,
    setRecurrenceAction,
    recurrenceWeekdays,
    setRecurrenceWeekdays,
  };
}
