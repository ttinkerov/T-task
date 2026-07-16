'use client';

import { useWorkspaceQuery, useUpdateWorkspaceMutation } from '../hooks';

export function WorkspaceOverdueSettings({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const { data: workspace, isLoading } = useWorkspaceQuery(workspaceId);
  const updateMutation = useUpdateWorkspaceMutation(workspaceId);

  if (isLoading || !workspace) {
    return <p className="text-sm text-muted-foreground">Загрузка настроек...</p>;
  }

  const handleToggle = async () => {
    await updateMutation.mutateAsync({
      autoRollOverdue: !workspace.autoRollOverdue,
    });
  };

  return (
    <div className="settings-card">
      <h2 className="settings-card__title">Просроченные задачи</h2>
      <p className="settings-card__text">
        Если дедлайн прошёл, а задача ещё не в «Готово», можно автоматически переносить её на
        следующий день. Счётчик дней просрочки сохраняется для всей команды.
      </p>

      <label className="forms-editor__checkbox">
        <input
          type="checkbox"
          checked={Boolean(workspace.autoRollOverdue)}
          onChange={() => void handleToggle()}
          disabled={!canManage || updateMutation.isPending}
        />
        Автоматически переносить просроченные задачи на следующий день
      </label>

      {!canManage ? (
        <p className="settings-card__hint">
          Изменить настройку могут только администраторы команды.
        </p>
      ) : null}
    </div>
  );
}
