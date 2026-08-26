import { Suspense } from 'react';
import { AuthShell } from '@/components/marketing/auth-shell';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <AuthShell
      title="Новый пароль"
      subtitle="Задайте новый пароль для входа в T-task."
      footerPrefix="Вернуться ко "
      footerHref="/login"
      footerLinkLabel="входу"
    >
      <Suspense fallback={<p className="text-sm text-white/60">Загрузка...</p>}>
        <ResetPasswordForm token={token} />
      </Suspense>
    </AuthShell>
  );
}
