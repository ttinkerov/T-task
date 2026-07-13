import Link from 'next/link';
import { AuthShell } from '@/components/marketing/auth-shell';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <AuthShell
      title="Вход"
      subtitle="Войдите в аккаунт, чтобы продолжить работу с проектами."
      footer={
        <>
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
