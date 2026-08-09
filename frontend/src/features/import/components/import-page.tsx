'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useBoardQuery } from '@/features/boards/hooks';
import ImportPageView from '@/vue/import/ImportPageView.vue';
import { useImportTasksMutation } from '../hooks';
import { mapDueDate } from '../lib/map-due-date';
import { mapPriority } from '../lib/map-priority';
import { parseJiraCsv } from '../lib/parse-csv';
import { suggestColumnMappings } from '../lib/suggest-mappings';
import type { ImportColumnMapping, ImportTasksResult, ParsedCsvFile } from '../types';
import { PRIORITY_LABELS } from '@/features/boards/types';

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

  const previewRows = useMemo(
    () =>
      (parsed?.rows.slice(0, 8) ?? []).map((row) => {
        const priority = mapPriority(row.priorityRaw);
        return {
          title: row.title,
          status: row.status,
          priority: priority ? PRIORITY_LABELS[priority] : '—',
          assignee: row.assignee || '—',
          labels: row.labels.join(', ') || '—',
        };
      }),
    [parsed],
  );

  const allMapped =
    mappings.length > 0 &&
    mappings.every((mapping) => {
      if (mapping.columnId) return true;
      return Boolean(mapping.newColumnName?.trim());
    });

  const resultIssues = useMemo(() => {
    if (!result) return [];
    return result.results
      .filter((item) => item.status === 'skipped' || item.warnings.length > 0)
      .slice(0, 30);
  }, [result]);

  const onFileSelect = useCallback(
    async (file: File | null) => {
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
    },
    [columns],
  );

  const onUpdateMapping = useCallback((payload: { status: string; columnValue: string }) => {
    setMappings((current) =>
      current.map((mapping) => {
        if (mapping.status !== payload.status) return mapping;
        if (payload.columnValue === CREATE_NEW) {
          return { status: payload.status, newColumnName: payload.status };
        }
        return { status: payload.status, columnId: payload.columnValue };
      }),
    );
  }, []);

  const onImport = useCallback(async () => {
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
      /* ignore */
    }
  }, [allMapped, boardQuery.data, importMutation, mappings, parsed]);

  const viewProps = useMemo(
    () => ({
      fileName,
      parseError: parseError ?? '',
      warnings: parsed?.warnings ?? [],
      rowCount: parsed?.rows.length ?? 0,
      statusCount: parsed?.statuses.length ?? 0,
      showWizard: Boolean(parsed && parsed.rows.length > 0),
      boardLoading: boardQuery.isLoading,
      boardError: boardQuery.isError
        ? boardQuery.error instanceof Error
          ? boardQuery.error.message
          : 'Не удалось загрузить доску'
        : '',
      mappings,
      columns,
      createNewValue: CREATE_NEW,
      previewRows,
      allMapped,
      isImporting: importMutation.isPending,
      importError: importMutation.isError
        ? (importMutation.error as Error)?.message || 'Не удалось импортировать'
        : '',
      result,
      resultIssues,
      onFileSelect,
      onUpdateMapping,
      onImport,
      onRetryBoard: () => {
        void boardQuery.refetch();
      },
    }),
    [
      fileName,
      parseError,
      parsed,
      boardQuery.isLoading,
      boardQuery.isError,
      boardQuery.error,
      boardQuery.refetch,
      mappings,
      columns,
      previewRows,
      allMapped,
      importMutation.isPending,
      importMutation.isError,
      importMutation.error,
      result,
      resultIssues,
      onFileSelect,
      onUpdateMapping,
      onImport,
    ],
  );

  return <VueIsland component={ImportPageView} componentProps={viewProps} />;
}
