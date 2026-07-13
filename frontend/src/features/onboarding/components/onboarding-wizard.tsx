'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import {
  TEAM_SIZE_OPTIONS,
  USE_CASE_OPTIONS,
  type TeamSize,
  type WorkspaceUseCase,
} from '@/features/boards/types';
import { useCreateWorkspaceMutation } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';

type Step = 'name' | 'teamSize' | 'useCases';

export function OnboardingWizard() {
  const router = useRouter();
  const { data: session } = useMeQuery();
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);
  const createWorkspaceMutation = useCreateWorkspaceMutation();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);
  const [useCases, setUseCases] = useState<WorkspaceUseCase[]>([]);

  if (!session) {
    return null;
  }

  const toggleUseCase = (value: WorkspaceUseCase) => {
    setUseCases((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const handleFinish = async () => {
    if (!name.trim() || !teamSize || useCases.length === 0) return;

    const workspace = await createWorkspaceMutation.mutateAsync({
      name: name.trim(),
      teamSize,
      useCases,
    });

    if (workspace?.id) {
      setCurrentWorkspaceId(workspace.id);
    }

    router.replace('/dashboard/board');
    router.refresh();
  };

  return (
    <section className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Шаг {step === 'name' ? 1 : step === 'teamSize' ? 2 : 3} из 3
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {step === 'name'
            ? 'Как назовёте команду?'
            : step === 'teamSize'
              ? 'Сколько примерно человек в команде?'
              : 'Для чего планируете использовать T-task?'}
        </h1>
      </div>

      {step === 'name' ? (
        <div className="space-y-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Acme Team"
            minLength={2}
            maxLength={80}
            className="glass-input"
            autoFocus
          />
          <button
            type="button"
            disabled={name.trim().length < 2}
            onClick={() => setStep('teamSize')}
            className="btn-primary w-full"
          >
            Далее
          </button>
        </div>
      ) : null}

      {step === 'teamSize' ? (
        <div className="space-y-4">
          <div className="grid gap-2">
            {TEAM_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTeamSize(option.value)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  teamSize === option.value
                    ? 'border-[#0077FF] bg-[rgba(0,119,255,0.12)]'
                    : 'border-border bg-secondary hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('name')} className="btn-ghost flex-1">
              Назад
            </button>
            <button
              type="button"
              disabled={!teamSize}
              onClick={() => setStep('useCases')}
              className="btn-primary flex-1"
            >
              Далее
            </button>
          </div>
        </div>
      ) : null}

      {step === 'useCases' ? (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {USE_CASE_OPTIONS.map((option) => {
              const selected = useCases.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleUseCase(option.value)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    selected
                      ? 'border-[#0077FF] bg-[rgba(0,119,255,0.12)]'
                      : 'border-border bg-secondary hover:bg-muted'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('teamSize')} className="btn-ghost flex-1">
              Назад
            </button>
            <button
              type="button"
              disabled={useCases.length === 0 || createWorkspaceMutation.isPending}
              onClick={handleFinish}
              className="btn-primary flex-1"
            >
              {createWorkspaceMutation.isPending ? 'Создание...' : 'Открыть доску'}
            </button>
          </div>
          {createWorkspaceMutation.error ? (
            <p className="text-sm text-red-400">{createWorkspaceMutation.error.message}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
