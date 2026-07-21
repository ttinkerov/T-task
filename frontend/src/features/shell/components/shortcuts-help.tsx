'use client';

import { SHORTCUTS } from '../lib/shortcuts';

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="shortcuts-help-overlay" onClick={onClose} role="presentation">
      <div
        className="shortcuts-help"
        role="dialog"
        aria-modal="true"
        aria-label="Клавиатурные сокращения"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shortcuts-help__header">
          <div>
            <p className="shortcuts-help__eyebrow">Power user</p>
            <h2>Шорткаты</h2>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <ul className="shortcuts-help__list">
          <li>
            <kbd>⌘K</kbd>
            <span>Командная палитра</span>
          </li>
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.id}>
              <kbd>{shortcut.label}</kbd>
              <span>
                {shortcut.description}
                {shortcut.scope === 'task' ? ' (в карточке)' : ''}
              </span>
            </li>
          ))}
          <li>
            <kbd>Esc</kbd>
            <span>Закрыть панель / сбросить выбор</span>
          </li>
        </ul>
        <p className="shortcuts-help__hint">Не работают, пока курсор в поле ввода.</p>
      </div>
    </div>
  );
}
