'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAiChatMutation, useAiSettingsQuery } from '../hooks';
import type { AiChatMessage } from '../types';

export function AiChatPanel({ workspaceId }: { workspaceId: string }) {
  const { data: settings, isLoading } = useAiSettingsQuery(workspaceId);
  const chatMutation = useAiChatMutation(workspaceId);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || chatMutation.isPending) return;

    const nextMessages: AiChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setError(null);

    try {
      const result = await chatMutation.mutateAsync({
        mode: 'chat',
        messages: nextMessages.slice(-20),
      });
      setMessages([...nextMessages, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить ответ');
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (!settings?.configured) {
    return (
      <div className="ai-chat ai-chat--empty">
        <h1 className="ai-chat__title">ИИ-чат</h1>
        <p className="ai-chat__lead">
          Чтобы начать, администратор команды вставляет API-токен в настройках.
        </p>
        <Link href={`/dashboard/workspaces/${workspaceId}/settings`} className="btn-primary">
          Открыть настройки
        </Link>
      </div>
    );
  }

  return (
    <div className="ai-chat">
      <header className="ai-chat__header">
        <div>
          <h1 className="ai-chat__title">ИИ-чат</h1>
          <p className="ai-chat__meta">
            {settings.provider} · {settings.model}
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setMessages([]);
            setError(null);
          }}
        >
          Очистить
        </button>
      </header>

      <div className="ai-chat__messages" ref={listRef}>
        {messages.length === 0 ? (
          <p className="ai-chat__placeholder">
            Спросите про приоритизацию, формулировку задач или план спринта.
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`ai-chat__bubble ai-chat__bubble--${message.role}`}
            >
              <span className="ai-chat__role">{message.role === 'user' ? 'Вы' : 'ИИ'}</span>
              <p>{message.content}</p>
            </div>
          ))
        )}
        {chatMutation.isPending ? <p className="ai-chat__placeholder">Думаю…</p> : null}
      </div>

      {error ? <p className="ai-chat__error">{error}</p> : null}

      <form className="ai-chat__composer" onSubmit={(event) => void handleSubmit(event)}>
        <textarea
          className="glass-input ai-chat__input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          maxLength={8000}
          placeholder="Напишите сообщение…"
          disabled={chatMutation.isPending}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={chatMutation.isPending || !input.trim()}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
