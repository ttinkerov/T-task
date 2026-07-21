'use client';

import { useEffect, useState } from 'react';
import { useAiSettingsQuery, useAiSummaryMutation } from '../hooks';
import type { AiSummaryResult, AiSummaryScope } from '../types';

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AiSummaryPanel({
  workspaceId,
  scope,
  sprintId,
  compact = false,
}: {
  workspaceId: string;
  scope: AiSummaryScope;
  sprintId?: string;
  compact?: boolean;
}) {
  const { data: settings } = useAiSettingsQuery(workspaceId);
  const summaryMutation = useAiSummaryMutation(workspaceId);
  const [date, setDate] = useState(todayIsoDate);
  const [result, setResult] = useState<AiSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [scope, sprintId, date]);

  if (!settings?.configured) {
    return null;
  }

  if (scope === 'sprint' && !sprintId) {
    return null;
  }

  const handleGenerate = async () => {
    setError(null);
    try {
      const data = await summaryMutation.mutateAsync(
        scope === 'sprint' ? { scope: 'sprint', sprintId } : { scope: 'day', date },
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить саммари');
    }
  };

  const title = scope === 'sprint' ? 'Саммари спринта' : 'Саммари дня';

  return (
    <div className={`ai-summary${compact ? ' ai-summary--compact' : ''}`}>
      <div className="ai-summary__head">
        <div>
          <p className="ai-summary__eyebrow">ИИ</p>
          <strong>{title}</strong>
        </div>
        <div className="ai-summary__actions">
          {scope === 'day' ? (
            <input
              className="glass-input ai-summary__date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          ) : null}
          <button
            type="button"
            className="btn-primary"
            disabled={summaryMutation.isPending}
            onClick={() => void handleGenerate()}
          >
            {summaryMutation.isPending ? 'Генерируем…' : 'Сгенерировать'}
          </button>
        </div>
      </div>

      {error ? <p className="ai-summary__error">{error}</p> : null}

      {result ? (
        <div className="ai-summary__body">
          <p className="ai-summary__stats">
            Закрыто: {result.stats.completedCount}
            {result.stats.completedPoints > 0 ? ` · ${result.stats.completedPoints} SP` : ''}
            {scope === 'sprint' ? ` · открыто: ${result.stats.openCount}` : ''}
            {result.stats.topAssignees[0] ? ` · топ: ${result.stats.topAssignees[0].name}` : ''}
          </p>
          <div className="ai-summary__text">{result.summary}</div>
          <p className="ai-summary__meta">{result.model}</p>
        </div>
      ) : (
        <p className="ai-summary__hint">
          {scope === 'sprint'
            ? 'Краткий обзор закрытых и открытых задач спринта.'
            : 'Сводка по задачам, закрытым за выбранный день.'}
        </p>
      )}
    </div>
  );
}
