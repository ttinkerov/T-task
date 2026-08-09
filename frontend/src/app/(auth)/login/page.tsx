import { Suspense } from 'react';
import { AuthShell } from '@/components/marketing/auth-shell';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <AuthShell
      title="Вход"
      subtitle="Войдите в аккаунт, чтобы продолжить работу с проектами."
      footerPrefix="Нет аккаунта? "
      footerHref="/register"
      footerLinkLabel="Зарегистрироваться"
    >
      <Suspense fallback={<p className="text-sm text-white/60">Загрузка...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
