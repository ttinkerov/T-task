'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { VueIsland } from '@/components/vue/VueIsland';
import { BoardEmptyState } from '@/features/boards/components/board-empty-state';
import { ApiError } from '@/shared/api/client';
import { useThemeStore, type ThemeMode } from '@/stores/theme.store';
import WhiteboardHeaderView from '@/vue/whiteboard/WhiteboardHeader.vue';
import WhiteboardLoadingView from '@/vue/whiteboard/WhiteboardLoading.vue';
import { fetchWhiteboard, saveWhiteboard } from '../api';
import { tldrawAssetUrls } from '../lib/tldraw-asset-urls';

const AUTOSAVE_MS = 1200;
const WELCOME_DISMISS_KEY = 'ttask:whiteboard-welcome-dismissed';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface WorkspaceWhiteboardProps {
  workspaceId: string;
}

function SyncTldrawTheme({ theme }: { theme: ThemeMode }) {
  const editor = useEditor();

  useEffect(() => {
    editor.user.updateUserPreferences({ colorScheme: theme });
  }, [editor, theme]);

  return null;
}

function FocusCanvasOnStart({ shouldFocus }: { shouldFocus: boolean }) {
  const editor = useEditor();

  useEffect(() => {
    if (!shouldFocus) return;
    editor.focus();
  }, [editor, shouldFocus]);

  return null;
}

function readWelcomeDismissed(workspaceId: string) {
  try {
    return window.sessionStorage.getItem(`${WELCOME_DISMISS_KEY}:${workspaceId}`) === '1';
  } catch {
    return false;
  }
}

function writeWelcomeDismissed(workspaceId: string) {
  try {
    window.sessionStorage.setItem(`${WELCOME_DISMISS_KEY}:${workspaceId}`, '1');
  } catch {
    /* ignore */
  }
}

export function WorkspaceWhiteboard({ workspaceId }: WorkspaceWhiteboardProps) {
  const theme = useThemeStore((state) => state.theme);
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedLabel, setUpdatedLabel] = useState<string | null>(null);
  const [isBlankBoard, setIsBlankBoard] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [focusCanvas, setFocusCanvas] = useState(false);
  const [loadNonce, setLoadNonce] = useState(0);
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
      setFocusCanvas(false);
      dirtyRef.current = false;
      storeRef.current = null;

      try {
        const response = await fetchWhiteboard(workspaceId);
        if (cancelled) return;

        const store = createTLStore();
        const snapshot = response.data?.snapshot;
        let loadedContent = false;
        if (snapshot && typeof snapshot === 'object') {
          try {
            loadSnapshot(store, snapshot as unknown as TLEditorSnapshot);
            loadedContent = true;
          } catch {
            /* ignore */
          }
        }

        const updatedAt = response.data?.updatedAt;
        const updatedBy = response.data?.updatedBy;
        const blank = !updatedAt && !loadedContent;
        setIsBlankBoard(blank);
        setShowWelcome(blank && !readWelcomeDismissed(workspaceId));

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
  }, [workspaceId, loadNonce]);

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
        setIsBlankBoard(false);
        setShowWelcome(false);
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
        setIsBlankBoard(false);
        setShowWelcome(false);
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

  const dismissWelcome = useCallback(() => {
    writeWelcomeDismissed(workspaceId);
    setShowWelcome(false);
    setFocusCanvas(true);
  }, [workspaceId]);

  const statusText = useMemo(() => {
    if (saveStatus === 'saving') return 'Сохранение…';
    if (saveStatus === 'saved') return 'Сохранено';
    if (saveStatus === 'error') return saveError ?? 'Ошибка сохранения';
    return updatedLabel ? `Обновлено: ${updatedLabel}` : 'Пустая доска';
  }, [saveError, saveStatus, updatedLabel]);

  const headerProps = useMemo(
    () => ({
      statusText,
      statusError: saveStatus === 'error',
    }),
    [statusText, saveStatus],
  );

  if (storeWithStatus.status === 'loading') {
    return <VueIsland component={WhiteboardLoadingView} componentProps={{}} />;
  }

  if (storeWithStatus.status === 'error') {
    return (
      <BoardEmptyState
        className="empty-state--board"
        icon="pen"
        title="Не удалось открыть доску"
        description={storeWithStatus.error.message}
        actionLabel="Повторить"
        onAction={() => setLoadNonce((value) => value + 1)}
      />
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <VueIsland component={WhiteboardHeaderView} componentProps={headerProps} />
      <div className="relative min-h-0 flex-1">
        <Tldraw store={storeWithStatus.store} assetUrls={tldrawAssetUrls} colorScheme={theme}>
          <SyncTldrawTheme theme={theme} />
          <FocusCanvasOnStart shouldFocus={focusCanvas} />
        </Tldraw>
        {showWelcome && isBlankBoard ? (
          <BoardEmptyState
            className="empty-state--overlay"
            icon="pen"
            title="Начните рисовать"
            description="Одна доска на команду: схемы, наброски и заметки. Всё сохраняется автоматически."
            actionLabel="Начать рисовать"
            onAction={dismissWelcome}
          />
        ) : null}
      </div>
    </div>
  );
}
