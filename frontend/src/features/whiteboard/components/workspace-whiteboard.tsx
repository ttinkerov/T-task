'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DefaultSpinner,
  Tldraw,
  createTLStore,
  getSnapshot,
  loadSnapshot,
  useEditor,
  type TLEditorSnapshot,
  type TLStoreWithStatus,
} from 'tldraw';
import 'tldraw/tldraw.css';
import '../styles/tldraw-theme.css';
import { ApiError } from '@/shared/api/client';
import { useThemeStore, type ThemeMode } from '@/stores/theme.store';
import { fetchWhiteboard, saveWhiteboard } from '../api';
import { tldrawAssetUrls } from '../lib/tldraw-asset-urls';

const AUTOSAVE_MS = 1200;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface WorkspaceWhiteboardProps {
  workspaceId: string;
}

/** Keep tldraw canvas/UI in sync with the app theme toggle. */
function SyncTldrawTheme({ theme }: { theme: ThemeMode }) {
  const editor = useEditor();

  useEffect(() => {
    editor.user.updateUserPreferences({ colorScheme: theme });
  }, [editor, theme]);

  return null;
}

export function WorkspaceWhiteboard({ workspaceId }: WorkspaceWhiteboardProps) {
  const theme = useThemeStore((state) => state.theme);
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedLabel, setUpdatedLabel] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const pendingSnapshotRef = useRef<Record<string, unknown> | null>(null);
  const dirtyRef = useRef(false);
  const persistRef = useRef<(snapshot: Record<string, unknown>) => void>(() => undefined);
  const storeRef = useRef<ReturnType<typeof createTLStore> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStoreWithStatus({ status: 'loading' });
      setSaveStatus('idle');
      setSaveError(null);
      dirtyRef.current = false;
      storeRef.current = null;

      try {
        const response = await fetchWhiteboard(workspaceId);
        if (cancelled) return;

        const store = createTLStore();
        const snapshot = response.data?.snapshot;
        if (snapshot && typeof snapshot === 'object') {
          try {
            loadSnapshot(store, snapshot as unknown as TLEditorSnapshot);
          } catch {
            // Corrupt or outdated snapshot — start empty rather than blocking the page.
          }
        }

        const updatedAt = response.data?.updatedAt;
        const updatedBy = response.data?.updatedBy;
        if (updatedAt) {
          const when = new Date(updatedAt).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });
          setUpdatedLabel(updatedBy?.name ? `${updatedBy.name} · ${when}` : when);
        } else {
          setUpdatedLabel(null);
        }

        storeRef.current = store;
        setStoreWithStatus({ status: 'synced-local', store });
      } catch (error) {
        if (cancelled) return;
        setStoreWithStatus({
          status: 'error',
          error: error instanceof Error ? error : new Error('Не удалось загрузить доску'),
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const persistSnapshot = useCallback(
    async (snapshot: Record<string, unknown>) => {
      if (saveInFlightRef.current) {
        pendingSnapshotRef.current = snapshot;
        return;
      }

      saveInFlightRef.current = true;
      setSaveStatus('saving');
      setSaveError(null);

      try {
        const response = await saveWhiteboard(workspaceId, snapshot);
        dirtyRef.current = false;
        const updatedAt = response.data?.updatedAt;
        const updatedBy = response.data?.updatedBy;
        if (updatedAt) {
          const when = new Date(updatedAt).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });
          setUpdatedLabel(updatedBy?.name ? `${updatedBy.name} · ${when}` : when);
        }
        setSaveStatus('saved');
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Не удалось сохранить';
        setSaveError(message);
        setSaveStatus('error');
      } finally {
        saveInFlightRef.current = false;
        const pending = pendingSnapshotRef.current;
        pendingSnapshotRef.current = null;
        if (pending) {
          void persistSnapshot(pending);
        }
      }
    },
    [workspaceId],
  );

  persistRef.current = (snapshot) => {
    void persistSnapshot(snapshot);
  };

  const flushPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const store = storeRef.current;
    if (!store || !dirtyRef.current) return;
    const { document } = getSnapshot(store);
    persistRef.current({ document });
  }, []);

  useEffect(() => {
    if (storeWithStatus.status !== 'synced-local') return;

    const { store } = storeWithStatus;
    storeRef.current = store;

    const unsubscribe = store.listen(
      () => {
        dirtyRef.current = true;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const { document } = getSnapshot(store);
          void persistSnapshot({ document });
        }, AUTOSAVE_MS);
      },
      { source: 'user', scope: 'document' },
    );

    const onPageHide = () => {
      flushPendingSave();
    };
    window.addEventListener('pagehide', onPageHide);

    return () => {
      unsubscribe();
      window.removeEventListener('pagehide', onPageHide);
      flushPendingSave();
    };
  }, [flushPendingSave, persistSnapshot, storeWithStatus]);

  const statusText = useMemo(() => {
    if (saveStatus === 'saving') return 'Сохранение…';
    if (saveStatus === 'saved') return 'Сохранено';
    if (saveStatus === 'error') return saveError ?? 'Ошибка сохранения';
    return updatedLabel ? `Обновлено: ${updatedLabel}` : 'Пустая доска';
  }, [saveError, saveStatus, updatedLabel]);

  if (storeWithStatus.status === 'loading') {
    return (
      <div className="flex h-full min-h-[480px] items-center justify-center gap-3 text-sm text-muted-foreground">
        <DefaultSpinner />
        Загрузка доски…
      </div>
    );
  }

  if (storeWithStatus.status === 'error') {
    return (
      <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-foreground">Не удалось открыть доску</p>
        <p className="max-w-md text-sm text-muted-foreground">{storeWithStatus.error.message}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-2">
        <div>
          <h1 className="text-sm font-medium text-foreground">Доска</h1>
          <p className="text-xs text-muted-foreground">
            Рисование и схемы для команды · без realtime
          </p>
        </div>
        <p
          className={`text-xs ${saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
          role="status"
          aria-live="polite"
        >
          {statusText}
        </p>
      </div>
      <div className="relative min-h-0 flex-1">
        <Tldraw store={storeWithStatus.store} assetUrls={tldrawAssetUrls} colorScheme={theme}>
          <SyncTldrawTheme theme={theme} />
        </Tldraw>
      </div>
    </div>
  );
}
