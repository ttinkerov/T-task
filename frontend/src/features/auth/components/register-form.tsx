'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useRegisterMutation } from '../hooks';

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await registerMutation.mutateAsync({
      name,
      email,
      password,
    });
    router.push('/onboarding');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Имя
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="glass-input"
        />
      </div>

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

      {registerMutation.error ? (
        <p className="text-sm text-red-400">{registerMutation.error.message}</p>
      ) : null}

      <button type="submit" disabled={registerMutation.isPending} className="btn-primary w-full">
        {registerMutation.isPending ? 'Создание...' : 'Создать аккаунт'}
      </button>
    </form>
  );
}
