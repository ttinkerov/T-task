import Link from 'next/link';
import { AuthShell } from '@/components/marketing/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создайте аккаунт и первую команду для работы в T-task."
      footer={
        <>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
