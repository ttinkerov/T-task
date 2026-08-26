'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          background: '#f3f4f6',
          color: '#111318',
        }}
      >
        <main
          style={{
            maxWidth: 28 * 16,
            margin: '4rem auto',
            padding: '1.5rem',
            borderRadius: 12,
            background: '#fff',
            border: '1px solid rgba(17,19,24,0.1)',
          }}
          role="alert"
        >
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Критическая ошибка</h1>
          <p style={{ margin: '0 0 1rem', color: '#5c6370', fontSize: '0.875rem' }}>
            Приложение не смогло отрисовать страницу. Попробуйте ещё раз.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '0.65rem 1.1rem',
              background: '#be185d',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Повторить
          </button>
        </main>
      </body>
    </html>
  );
}
