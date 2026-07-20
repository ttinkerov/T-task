'use client';

import { FormEvent, useState } from 'react';
import { useAiChatMutation, useAiSettingsQuery } from '../hooks';
import type { AiChatMessage } from '../types';

const QUICK_PROMPTS = [
  'Разбей на подзадачи',
  'Улучши формулировку названия и описания',
  'Какие риски и зависимости?',
  'Предложи критерии готовности',
];

export function TaskAiAssistant({
  workspaceId,
  taskTitle,
  taskDescription,
}: {
  workspaceId: string;
  taskTitle: string;
  taskDescription: string;
}) {
  const { data: settings } = useAiSettingsQuery(workspaceId);
  const chatMutation = useAiChatMutation(workspaceId);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!settings?.configured) {
    return null;
  }

  const ask = async (prompt: string) => {
    const content = prompt.trim();
    if (!content || chatMutation.isPending) return;

    const nextMessages: AiChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setError(null);

    try {
      const result = await chatMutation.mutateAsync({
        mode: 'task',
        taskTitle,
        taskDescription,
        messages: nextMessages.slice(-20),
      });
      setMessages([...nextMessages, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка ИИ');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput('');
    await ask(content);
  };

  return (
    <div className="task-ai">
      <button
        type="button"
        className="btn-ghost task-ai__toggle"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Скрыть ИИ-помощника' : 'Спросить ИИ'}
      </button>

      {open ? (
        <div className="task-ai__panel">
          <div className="task-ai__prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="btn-ghost task-ai__chip"
                disabled={chatMutation.isPending}
                onClick={() => void ask(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="task-ai__messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`task-ai__msg task-ai__msg--${message.role}`}
              >
                <strong>{message.role === 'user' ? 'Вы' : 'ИИ'}</strong>
                <p>{message.content}</p>
              </div>
            ))}
            {chatMutation.isPending ? <p className="settings-card__hint">Думаю…</p> : null}
          </div>

          {error ? <p className="ai-chat__error">{error}</p> : null}

          <form className="task-ai__composer" onSubmit={(event) => void handleSubmit(event)}>
            <input
              className="glass-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Вопрос по этой задаче…"
              maxLength={2000}
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={chatMutation.isPending || !input.trim()}
            >
              →
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
