import { AuthShell } from '@/components/marketing/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создайте аккаунт и первую команду для работы в T-task."
      footerPrefix="Уже есть аккаунт? "
      footerHref="/login"
      footerLinkLabel="Войти"
    >
      <RegisterForm />
    </AuthShell>
  );
}
