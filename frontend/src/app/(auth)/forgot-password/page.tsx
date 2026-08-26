import { Suspense } from 'react';
import { AuthShell } from '@/components/marketing/auth-shell';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Сброс пароля"
      subtitle="Отправим ссылку на email, если аккаунт существует."
      footerPrefix="Вспомнили пароль? "
      footerHref="/login"
      footerLinkLabel="Войти"
    >
      <Suspense fallback={<p className="text-sm text-white/60">Загрузка...</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
