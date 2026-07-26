import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionPending?: boolean;
  actionDisabled?: boolean;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionPending = false,
  actionDisabled = false,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)} role="status">
      {Icon ? (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.75} />
        </span>
      ) : null}
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__description">{description}</p>
      <button
        type="button"
        className="btn-primary empty-state__action"
        onClick={onAction}
        disabled={actionDisabled || actionPending}
      >
        {actionPending ? 'Создание…' : actionLabel}
      </button>
      {children}
    </div>
  );
}
