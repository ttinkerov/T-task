'use client';

import { FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { useUpdateColumnAutomationsMutation } from '../hooks';
import type { BoardColumn } from '../types';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ColumnAutomationDialog({
  workspaceId,
  column,
  onClose,
}: {
  workspaceId: string;
  column: BoardColumn;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { data: members = [] } = useMembersQuery(workspaceId);
  const updateMutation = useUpdateColumnAutomationsMutation(workspaceId);
  const assignAutomation = column.automations.find((item) => item.action === 'ASSIGN_USER');
  const [assignUserId, setAssignUserId] = useState(assignAutomation?.assigneeId ?? '');
  const [startTimer, setStartTimer] = useState(
    column.automations.some((item) => item.action === 'START_TIMER'),
  );
  const [completeTask, setCompleteTask] = useState(
    column.automations.some((item) => item.action === 'COMPLETE_TASK'),
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== 'Tab' || !dialog) {
        return;
      }

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
      );

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [handleClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await updateMutation.mutateAsync({
        columnId: column.id,
        data: {
          assignUserId: assignUserId || null,
          startTimer,
          completeTask,
        },
      });
      handleClose();
    } catch {
      // Surface via updateMutation.error / role="alert"
    }
  };

  return createPortal(
    <div className="automation-dialog__backdrop" onMouseDown={handleClose}>
      <div
        ref={dialogRef}
        className="automation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="automation-dialog__header">
          <div>
            <span className="automation-dialog__eyebrow">Автоматизация колонки</span>
            <h2 id={titleId}>{column.name}</h2>
          </div>
          <button
            type="button"
            className="automation-dialog__close"
            onClick={handleClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <p className="automation-dialog__description">
          Выбранные действия выполнятся один раз, когда задача попадёт в эту колонку.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="automation-dialog__field">
            <span>Назначить исполнителя</span>
            <select value={assignUserId} onChange={(event) => setAssignUserId(event.target.value)}>
              <option value="">Не назначать</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name} · {member.user.email}
                </option>
              ))}
            </select>
          </label>

          <label className="automation-dialog__option">
            <input
              type="checkbox"
              checked={startTimer}
              onChange={(event) => {
                setStartTimer(event.target.checked);
                if (event.target.checked) setCompleteTask(false);
              }}
            />
            <span>
              <strong>Запустить таймер</strong>
              <small>Начать учёт времени, если таймер ещё не запущен</small>
            </span>
          </label>

          <label className="automation-dialog__option">
            <input
              type="checkbox"
              checked={completeTask}
              onChange={(event) => {
                setCompleteTask(event.target.checked);
                if (event.target.checked) setStartTimer(false);
              }}
            />
            <span>
              <strong>Выполнить задачу</strong>
              <small>Остановить таймер, записать время и сбросить просрочку</small>
            </span>
          </label>

          <p className="automation-dialog__error" role="alert">
            {updateMutation.error?.message ?? ''}
          </p>

          <div className="automation-dialog__actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
