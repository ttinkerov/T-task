'use client';

import { useEffect } from 'react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[auth/error]', error);
  }, [error]);

  return (
    <main className="island-error island-error--page" role="alert">
      <h1 className="island-error__heading">Ошибка на странице входа</h1>
      <p className="island-error__text">Попробуйте обновить форму или вернуться позже.</p>
      <button type="button" className="btn-primary" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
