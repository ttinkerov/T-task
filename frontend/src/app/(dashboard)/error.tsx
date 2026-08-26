'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard/error]', error);
  }, [error]);

  return (
    <main className="island-error island-error--page" role="alert">
      <h1 className="island-error__heading">Что-то пошло не так</h1>
      <p className="island-error__text">
        Страница не загрузилась. Можно попробовать ещё раз — данные не пропадут.
      </p>
      <button type="button" className="btn-primary" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
