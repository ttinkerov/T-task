'use client';

type WorkspaceGateStatusProps = {
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
};

export function WorkspaceGateStatus({ isLoading, isError, onRetry }: WorkspaceGateStatusProps) {
  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Загрузка команды…
      </p>
    );
  }

  if (isError) {
    return (
      <div className="text-sm" role="alert">
        <p className="text-red-400">Не удалось загрузить команды.</p>
        {onRetry ? (
          <button type="button" className="board-filters__chip" onClick={onRetry}>
            Повторить
          </button>
        ) : null}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Выберите команду справа в шапке.</p>;
}
