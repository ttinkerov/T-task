'use client';

export function TaskDrawerHeader({
  columnName,
  onClose,
}: {
  columnName: string;
  onClose: () => void;
}) {
  return (
    <div className="task-drawer__header">
      <div>
        <p className="task-drawer__eyebrow">{columnName}</p>
        <h2 className="task-drawer__heading">Задача</h2>
      </div>
      <button
        type="button"
        className="dashboard-header__icon-btn"
        onClick={onClose}
        aria-label="Закрыть"
      >
        ×
      </button>
    </div>
  );
}
