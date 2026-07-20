'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  useAiSettingsQuery,
  useDeleteAiSettingsMutation,
  useTestAiConnectionMutation,
  useUpsertAiSettingsMutation,
} from '../hooks';
import { AI_PROVIDER_OPTIONS, type AiProvider } from '../types';

export function AiSettingsCard({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const { data: settings, isLoading } = useAiSettingsQuery(workspaceId);
  const upsertMutation = useUpsertAiSettingsMutation(workspaceId);
  const deleteMutation = useDeleteAiSettingsMutation(workspaceId);
  const testMutation = useTestAiConnectionMutation(workspaceId);

  const [provider, setProvider] = useState<AiProvider>('OPENAI');
  const [model, setModel] = useState('gpt-4o-mini');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.provider);
    setModel(settings.model);
    setBaseUrl(settings.baseUrl ?? '');
  }, [settings]);

  if (isLoading || !settings) {
    return <p className="text-sm text-muted-foreground">Загрузка настроек ИИ…</p>;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await upsertMutation.mutateAsync({
        provider,
        model: model.trim() || undefined,
        baseUrl: provider === 'CUSTOM' || baseUrl.trim() ? baseUrl.trim() : undefined,
        apiToken: apiToken.trim(),
      });
      setApiToken('');
      setMessage('Токен сохранён. Можно пользоваться чатом и помощником.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить');
    }
  };

  const handleTest = async () => {
    setMessage(null);
    try {
      const result = await testMutation.mutateAsync();
      setMessage(`Подключение ок · модель ${result.model}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Проверка не удалась');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить сохранённый токен ИИ для этой команды?')) return;
    setMessage(null);
    try {
      await deleteMutation.mutateAsync();
      setApiToken('');
      setMessage('Токен удалён.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось удалить');
    }
  };

  return (
    <div className="settings-card">
      <h2 className="settings-card__title">ИИ</h2>
      <p className="settings-card__text">
        Вставьте API-токен OpenAI-совместимого провайдера (OpenAI, OpenRouter, Groq или свой
        endpoint). Токен хранится только на сервере в зашифрованном виде.
      </p>

      {settings.configured ? (
        <p className="settings-card__hint">
          Настроено · {settings.provider} · модель {settings.model} · токен …{settings.tokenLast4}
        </p>
      ) : (
        <p className="settings-card__hint">Токен ещё не задан — чат и помощник недоступны.</p>
      )}

      {!canManage ? (
        <p className="settings-card__hint">Изменить токен могут только администраторы команды.</p>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="ai-settings-form">
          <label className="task-drawer__field">
            <span>Провайдер</span>
            <select
              className="glass-input"
              value={provider}
              onChange={(event) => setProvider(event.target.value as AiProvider)}
            >
              {AI_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="task-drawer__field">
            <span>Модель</span>
            <input
              className="glass-input"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="gpt-4o-mini"
              maxLength={120}
            />
          </label>

          {provider === 'CUSTOM' ? (
            <label className="task-drawer__field">
              <span>Base URL</span>
              <input
                className="glass-input"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://api.example.com/v1"
                required
                maxLength={512}
              />
            </label>
          ) : null}

          <label className="task-drawer__field">
            <span>API-токен</span>
            <input
              className="glass-input"
              type="password"
              autoComplete="off"
              value={apiToken}
              onChange={(event) => setApiToken(event.target.value)}
              placeholder={settings.configured ? '•••• вставьте новый, чтобы заменить' : 'sk-…'}
              required
              minLength={8}
              maxLength={512}
            />
          </label>

          <div className="ai-settings-form__actions">
            <button type="submit" className="btn-primary" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Сохранение…' : 'Сохранить токен'}
            </button>
            {settings.configured ? (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => void handleTest()}
                  disabled={testMutation.isPending}
                >
                  Проверить
                </button>
                <button
                  type="button"
                  className="btn-ghost task-drawer__danger"
                  onClick={() => void handleDelete()}
                  disabled={deleteMutation.isPending}
                >
                  Удалить
                </button>
              </>
            ) : null}
          </div>
        </form>
      )}

      {message ? <p className="settings-card__hint">{message}</p> : null}
    </div>
  );
}
