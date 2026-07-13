'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useLoginMutation } from '../hooks';

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const session = await loginMutation.mutateAsync({ email, password });
    const destination =
      session && session.workspaces.length === 0 ? '/onboarding' : '/dashboard/board';
    router.push(destination);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="glass-input"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Пароль
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="glass-input"
        />
      </div>

      {loginMutation.error ? (
        <p className="text-sm text-red-400">{loginMutation.error.message}</p>
      ) : null}

      <button type="submit" disabled={loginMutation.isPending} className="btn-primary w-full">
        {loginMutation.isPending ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}
