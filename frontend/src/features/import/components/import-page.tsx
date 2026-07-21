'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useBoardQuery } from '@/features/boards/hooks';
import { useImportTasksMutation } from '../hooks';
import { mapDueDate } from '../lib/map-due-date';
import { mapPriority } from '../lib/map-priority';
import { parseJiraCsv } from '../lib/parse-csv';
import { suggestColumnMappings } from '../lib/suggest-mappings';
import type { ImportColumnMapping, ImportTasksResult, ParsedCsvFile } from '../types';

const CREATE_NEW = '__create_new__';

export function ImportPage({ workspaceId }: { workspaceId: string }) {
  const boardQuery = useBoardQuery(workspaceId);
  const importMutation = useImportTasksMutation(workspaceId);

  const [parsed, setParsed] = useState<ParsedCsvFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [mappings, setMappings] = useState<ImportColumnMapping[]>([]);
  const [result, setResult] = useState<ImportTasksResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const columns = boardQuery.data?.columns ?? [];

  useEffect(() => {
    if (!parsed || columns.length === 0) return;
    setMappings((current) => {
      const untouched =
        current.length === 0 ||
        current.every((mapping) => !mapping.columnId && mapping.newColumnName === mapping.status);
      if (!untouched && current.length === parsed.statuses.length) return current;
      return suggestColumnMappings(parsed.statuses, columns);
    });
  }, [columns, parsed]);

  const previewRows = useMemo(() => parsed?.rows.slice(0, 8) ?? [], [parsed]);

  const allMapped =
    mappings.length > 0 &&
    mappings.every((mapping) => {
      if (mapping.columnId) return true;
      return Boolean(mapping.newColumnName?.trim());
    });

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setResult(null);
    setParseError(null);

    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Нужен файл .csv (экспорт из Jira → Export → CSV)');
      return;
    }

    try {
      const text = await file.text();
      const next = parseJiraCsv(text);
      setParsed(next);
      setFileName(file.name);
      setMappings(suggestColumnMappings(next.statuses, columns));
      if (next.rows.length === 0) {
        setParseError(next.warnings[0] ?? 'Не удалось разобрать файл');
      }
    } catch {
      setParseError('Не удалось прочитать файл');
      setParsed(null);
      setMappings([]);
    }
  };

  const updateMapping = (status: string, columnValue: string) => {
    setMappings((current) =>
      current.map((mapping) => {
        if (mapping.status !== status) return mapping;
        if (columnValue === CREATE_NEW) {
          return { status, newColumnName: status };
        }
        return { status, columnId: columnValue };
      }),
    );
  };

  const handleImport = async () => {
    if (!parsed || !allMapped || !boardQuery.data) return;
    setResult(null);

    const rows = parsed.rows.map((row) => {
      const priority = mapPriority(row.priorityRaw);
      const dueDate = mapDueDate(row.dueDateRaw);
      return {
        title: row.title,
        status: row.status,
        description: row.description || undefined,
        priority,
        dueDate,
        assignee: row.assignee || undefined,
        labels: row.labels.length > 0 ? row.labels : undefined,
      };
    });

    try {
      const data = await importMutation.mutateAsync({
        boardId: boardQuery.data.id,
        columnMappings: mappings,
        rows,
      });
      setResult(data);
    } catch {
      // error surfaced via mutation
    }
  };

  return (
    <div className="import-page">
      <header className="import-page__header">
        <h1>Импорт из Jira / CSV</h1>
        <p>
          Экспортируйте задачи в CSV из Jira и загрузите сюда — сопоставим статусы с колонками доски
          и создадим карточки за один проход.
        </p>
      </header>

      <section className="import-page__block">
        <h2>1. Файл</h2>
        <label className="import-page__file">
          <input type="file" accept=".csv,text/csv" onChange={(event) => void handleFile(event)} />
          <span>{fileName || 'Выбрать CSV'}</span>
        </label>
        {parseError ? <p className="import-page__error">{parseError}</p> : null}
        {parsed?.warnings.map((warning) => (
          <p key={warning} className="import-page__hint">
            {warning}
          </p>
        ))}
        {parsed && parsed.rows.length > 0 ? (
          <p className="import-page__meta">
            Строк: {parsed.rows.length} · Статусов: {parsed.statuses.length}
          </p>
        ) : null}
      </section>

      {parsed && parsed.rows.length > 0 ? (
        <>
          <section className="import-page__block">
            <h2>2. Статусы → колонки</h2>
            {boardQuery.isLoading ? (
              <p className="import-page__hint">Загружаем доску…</p>
            ) : (
              <ul className="import-page__mappings">
                {mappings.map((mapping) => {
                  const value = mapping.columnId ?? CREATE_NEW;
                  return (
                    <li key={mapping.status}>
                      <span className="import-page__status">{mapping.status}</span>
                      <select
                        className="glass-input"
                        value={value}
                        onChange={(event) => updateMapping(mapping.status, event.target.value)}
                      >
                        {columns.map((column) => (
                          <option key={column.id} value={column.id}>
                            {column.name}
                          </option>
                        ))}
                        <option value={CREATE_NEW}>Создать колонку «{mapping.status}»</option>
                      </select>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="import-page__block">
            <h2>3. Превью</h2>
            <div className="import-page__table-wrap">
              <table className="import-page__table">
                <thead>
                  <tr>
                    <th>Заголовок</th>
                    <th>Статус</th>
                    <th>Приоритет</th>
                    <th>Исполнитель</th>
                    <th>Метки</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={`${row.title}-${index}`}>
                      <td>{row.title}</td>
                      <td>{row.status}</td>
                      <td>{mapPriority(row.priorityRaw) ?? '—'}</td>
                      <td>{row.assignee || '—'}</td>
                      <td>{row.labels.join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.rows.length > previewRows.length ? (
              <p className="import-page__hint">
                Показаны первые {previewRows.length} из {parsed.rows.length}
              </p>
            ) : null}
          </section>

          <section className="import-page__actions">
            <button
              type="button"
              className="btn-primary"
              disabled={!allMapped || importMutation.isPending || columns.length === 0}
              onClick={() => void handleImport()}
            >
              {importMutation.isPending
                ? 'Импортируем…'
                : `Импортировать ${parsed.rows.length} задач`}
            </button>
            {importMutation.isError ? (
              <p className="import-page__error">
                {(importMutation.error as Error)?.message || 'Не удалось импортировать'}
              </p>
            ) : null}
          </section>
        </>
      ) : null}

      {result ? (
        <section className="import-page__block import-page__result">
          <h2>Готово</h2>
          <p>
            Создано: {result.created} · Пропущено: {result.skipped} · Всего: {result.total}
          </p>
          {result.results.some((item) => item.warnings.length > 0 || item.status === 'skipped') ? (
            <ul className="import-page__result-list">
              {result.results
                .filter((item) => item.status === 'skipped' || item.warnings.length > 0)
                .slice(0, 30)
                .map((item) => (
                  <li key={`${item.index}-${item.title}`}>
                    <strong>{item.title || `(строка ${item.index + 1})`}</strong>
                    {item.reason ? ` — ${item.reason}` : null}
                    {item.warnings.length > 0 ? ` · ${item.warnings.join('; ')}` : null}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="import-page__hint">Все строки созданы без предупреждений.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
