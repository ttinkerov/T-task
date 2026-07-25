'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { useTaskWatchersQuery, useToggleWatchMutation } from '@/features/watchers/hooks';
import { FieldHint } from '../field-hint';

export function TaskAssigneeWatchFields({
  workspaceId,
  taskId,
  assigneeId,
  onAssigneeChange,
}: {
  workspaceId: string;
  taskId: string;
  assigneeId: string;
  onAssigneeChange: (id: string) => void;
}) {
  const { data: members = [] } = useMembersQuery(workspaceId);
  const { data: watchState } = useTaskWatchersQuery(workspaceId, taskId);
  const toggleWatchMutation = useToggleWatchMutation(workspaceId, taskId);

  return (
    <div className="task-drawer__grid">
      <label className="task-drawer__field">
        <span className="task-drawer__label">
          Исполнитель
          <FieldHint text="Кто отвечает за выполнение задачи. Видит её в «Мои задачи»." />
        </span>
        <select
          value={assigneeId}
          onChange={(event) => onAssigneeChange(event.target.value)}
          className="glass-input"
        >
          <option value="">Не назначен</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.user.name}
            </option>
          ))}
        </select>
      </label>

      <div className="task-drawer__field">
        <span className="task-drawer__label">
          Наблюдение
          <FieldHint text="Подписка на уведомления по задаче, даже если вы не исполнитель." />
        </span>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => void toggleWatchMutation.mutateAsync(Boolean(watchState?.watching))}
          disabled={toggleWatchMutation.isPending}
        >
          {watchState?.watching ? (
            <>
              <EyeOff size={14} /> Не следить
            </>
          ) : (
            <>
              <Eye size={14} /> Следить
            </>
          )}
        </button>
        {watchState?.watchers?.length ? (
          <p className="settings-card__hint">
            Следят: {watchState.watchers.map((item) => item.name).join(', ')}
          </p>
        ) : null}
      </div>
    </div>
  );
}
