import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/marketing/landing-page';
import type { AuthSession } from '@/features/auth/types';
import { serverApiFetch } from '@/shared/api/server-client';

export default async function HomePage() {
  let session: AuthSession | null = null;

  try {
    const response = await serverApiFetch<AuthSession>('/api/v1/auth/me');
    session = response.data;
  } catch {
    session = null;
  }

  if (session) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
