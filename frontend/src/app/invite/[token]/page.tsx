'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  useAcceptInvitationMutation,
  useInvitationPreviewQuery,
} from '@/features/workspaces/hooks';
import { useMeQuery } from '@/features/auth/hooks';

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const { data: session } = useMeQuery();
  const { data: preview, isLoading, isError } = useInvitationPreviewQuery(token);
  const acceptMutation = useAcceptInvitationMutation();

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(token);
      router.push('/dashboard');
      router.refresh();
    } catch {
      /* error shown via acceptMutation.error */
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <p className="text-sm text-slate-500">Загрузка приглашения...</p>
      </main>
    );
  }

  if (isError || !preview) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="text-2xl font-semibold">Приглашение недействительно</h1>
        <p className="text-sm text-slate-600">Ссылка истекла или уже была использована.</p>
        <Link href="/login" className="text-sm underline">
          Войти
        </Link>
      </main>
    );
  }

  const acceptError =
    acceptMutation.error instanceof Error
      ? acceptMutation.error.message
      : acceptMutation.isError
        ? 'Не удалось принять приглашение'
        : '';

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Приглашение</p>
        <h1 className="text-3xl font-semibold">{preview.workspace.name}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Вас приглашают как <span className="font-medium">{preview.role}</span>
        </p>
        <p className="text-sm text-slate-500">Email: {preview.email}</p>
      </div>

      {!session ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Войдите под приглашённым email, чтобы принять.</p>
          <Link
            href={`/login?next=/invite/${token}`}
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Войти
          </Link>
        </div>
      ) : session.user.email.toLowerCase() !== preview.email.toLowerCase() ? (
        <p className="text-sm text-red-600">
          Вы вошли как {session.user.email}, но приглашение для {preview.email}.
        </p>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={acceptMutation.isPending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          >
            {acceptMutation.isPending ? 'Принимаем...' : 'Принять приглашение'}
          </button>
          {acceptError ? (
            <p className="text-sm text-red-600" role="alert">
              {acceptError}
            </p>
          ) : null}
        </div>
      )}
    </main>
  );
}
