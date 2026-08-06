'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import { createTask, fetchBoards, fetchBoard } from '@/features/boards/api';
import { useCreateWorkspaceMutation } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import OnboardingWizardView from '@/vue/onboarding/OnboardingWizardView.vue';

type Step = 'workspace' | 'board' | 'task';

const BOARD_COLUMNS = ['Бэклог', 'В работе', 'Готово'] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const { data: session } = useMeQuery();
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);
  const createWorkspaceMutation = useCreateWorkspaceMutation();

  const [step, setStep] = useState<Step>('workspace');
  const [name, setName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const finishSetup = useCallback(
    async (withTask: boolean) => {
      if (!name.trim()) return;
      setError(null);
      setIsFinishing(true);

      try {
        const workspace = await createWorkspaceMutation.mutateAsync({
          name: name.trim(),
          teamSize: 'SOLO',
          useCases: ['OTHER'],
        });

        if (!workspace?.id) {
          throw new Error('Не удалось создать команду');
        }

        setCurrentWorkspaceId(workspace.id);

        const boardsResponse = await fetchBoards(workspace.id);
        const boardId = boardsResponse.data?.[0]?.id;
        if (!boardId) {
          throw new Error('Не удалось открыть доску');
        }

        let taskId: string | null = null;
        const title = taskTitle.trim();
        if (withTask && title) {
          const boardResponse = await fetchBoard(workspace.id, boardId);
          const firstColumnId = boardResponse.data?.columns[0]?.id;
          if (!firstColumnId) {
            throw new Error('На доске нет колонок');
          }
          const taskResponse = await createTask(workspace.id, {
            title,
            columnId: firstColumnId,
          });
          taskId = taskResponse.data?.id ?? null;
        }

        const params = new URLSearchParams({ board: boardId });
        if (taskId) params.set('task', taskId);
        router.replace(`/dashboard/board?${params.toString()}`);
        router.refresh();
      } catch (finishError) {
        setError(
          finishError instanceof Error ? finishError.message : 'Не удалось завершить настройку',
        );
        setIsFinishing(false);
      }
    },
    [createWorkspaceMutation, name, router, setCurrentWorkspaceId, taskTitle],
  );

  const onWorkspaceNext = useCallback(() => {
    if (name.trim().length < 2) return;
    setStep('board');
  }, [name]);

  const onBack = useCallback(() => {
    setStep((current) => {
      if (current === 'task') return 'board';
      if (current === 'board') return 'workspace';
      return current;
    });
  }, []);

  const onBoardNext = useCallback(() => setStep('task'), []);
  const onFinishWithTask = useCallback(() => void finishSetup(true), [finishSetup]);
  const onSkipTask = useCallback(() => void finishSetup(false), [finishSetup]);

  const displayError = error ?? createWorkspaceMutation.error?.message ?? '';

  const viewProps = useMemo(
    () => ({
      step,
      name,
      taskTitle,
      error: displayError,
      isFinishing,
      boardColumns: [...BOARD_COLUMNS],
      onNameChange: setName,
      onWorkspaceNext,
      onBoardNext,
      onBack,
      onTaskTitleChange: setTaskTitle,
      onFinishWithTask,
      onSkipTask,
    }),
    [
      step,
      name,
      taskTitle,
      displayError,
      isFinishing,
      onWorkspaceNext,
      onBoardNext,
      onBack,
      onFinishWithTask,
      onSkipTask,
    ],
  );

  if (!session) {
    return null;
  }

  return <VueIsland component={OnboardingWizardView} componentProps={viewProps} />;
}
