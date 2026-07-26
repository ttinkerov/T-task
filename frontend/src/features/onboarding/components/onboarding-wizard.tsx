'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import { createTask, fetchBoards, fetchBoard } from '@/features/boards/api';
import { useCreateWorkspaceMutation } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';

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

  if (!session) {
    return null;
  }

  const stepIndex = step === 'workspace' ? 1 : step === 'board' ? 2 : 3;

  const finishSetup = async (withTask: boolean) => {
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
  };

  const handleWorkspaceNext = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setStep('board');
  };

  return (
    <section className="onboarding" aria-labelledby="onboarding-title">
      <header className="onboarding__header">
        <p className="onboarding__eyebrow">Старт за 30 секунд · шаг {stepIndex} из 3</p>
        <h1 id="onboarding-title" className="onboarding__title">
          {step === 'workspace'
            ? 'Создайте команду'
            : step === 'board'
              ? 'Доска уже готова'
              : 'Добавьте первую задачу'}
        </h1>
        <p className="onboarding__lead">
          {step === 'workspace'
            ? 'Команда — это пространство, где живут доски, задачи и CRM.'
            : step === 'board'
              ? 'Мы сразу подготовим канбан с тремя колонками. Останется только задача.'
              : 'Одна задача — и вы уже в рабочем потоке. Потом можно править на доске.'}
        </p>
      </header>

      <ol className="onboarding__steps" aria-hidden="true">
        <li className={stepIndex >= 1 ? 'is-active' : undefined}>Команда</li>
        <li className={stepIndex >= 2 ? 'is-active' : undefined}>Доска</li>
        <li className={stepIndex >= 3 ? 'is-active' : undefined}>Задача</li>
      </ol>

      {step === 'workspace' ? (
        <form className="onboarding__panel" onSubmit={handleWorkspaceNext}>
          <label className="onboarding__label" htmlFor="workspace-name">
            Название команды
          </label>
          <input
            id="workspace-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Acme Team"
            minLength={2}
            maxLength={80}
            className="glass-input"
            autoFocus
            required
          />
          <button type="submit" disabled={name.trim().length < 2} className="btn-primary w-full">
            Далее — к доске
          </button>
        </form>
      ) : null}

      {step === 'board' ? (
        <div className="onboarding__panel">
          <div className="onboarding__board-preview" aria-label="Превью доски">
            {BOARD_COLUMNS.map((column) => (
              <div key={column} className="onboarding__column">
                <strong>{column}</strong>
                <span />
                <span />
              </div>
            ))}
          </div>
          <p className="onboarding__hint">
            Для «{name.trim()}» создадим доску с колонками Бэклог → В работе → Готово.
          </p>
          <div className="onboarding__actions">
            <button type="button" onClick={() => setStep('workspace')} className="btn-ghost flex-1">
              Назад
            </button>
            <button type="button" onClick={() => setStep('task')} className="btn-primary flex-1">
              Далее — к задаче
            </button>
          </div>
        </div>
      ) : null}

      {step === 'task' ? (
        <form
          className="onboarding__panel"
          onSubmit={(event) => {
            event.preventDefault();
            void finishSetup(true);
          }}
        >
          <label className="onboarding__label" htmlFor="first-task">
            Название первой задачи
          </label>
          <input
            id="first-task"
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Например, Настроить доску под команду"
            maxLength={200}
            className="glass-input"
            autoFocus
            required
          />
          <div className="onboarding__actions">
            <button
              type="button"
              onClick={() => setStep('board')}
              className="btn-ghost flex-1"
              disabled={isFinishing}
            >
              Назад
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={taskTitle.trim().length < 2 || isFinishing}
            >
              {isFinishing ? 'Создание…' : 'Создать и открыть доску'}
            </button>
          </div>
          <button
            type="button"
            className="onboarding__skip"
            disabled={isFinishing}
            onClick={() => void finishSetup(false)}
          >
            Пропустить задачу и открыть пустую доску
          </button>
        </form>
      ) : null}

      {error || createWorkspaceMutation.error ? (
        <p className="onboarding__error" role="alert">
          {error ?? createWorkspaceMutation.error?.message}
        </p>
      ) : null}
    </section>
  );
}
