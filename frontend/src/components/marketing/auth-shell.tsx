import Link from 'next/link';
import type { ReactNode } from 'react';
import { TeamMomentumBackground } from './team-momentum-background';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="landing-page">
      <TeamMomentumBackground />

      <div className="landing-content lg:grid lg:min-h-screen lg:grid-cols-2">
        <section className="hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <Link href="/" className="landing-logo">
            T-task<sup>®</sup>
          </Link>

          <div className="max-w-md space-y-4">
            <p className="landing-eyebrow" style={{ marginBottom: 0 }}>
              Для команд, которые ценят фокус
            </p>
            <h1 className="landing-title" style={{ fontSize: '2.75rem' }}>
              Организуйте работу <em>без шума.</em>
            </h1>
            <p className="landing-subtitle" style={{ marginTop: '1rem' }}>
              Канбан, workspaces и роли — в одном лёгком продукте.
            </p>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>© T-task</p>
        </section>

        <section className="flex flex-col justify-center px-6 py-16 sm:px-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="landing-logo" style={{ fontSize: '1.5rem' }}>
                T-task
              </Link>
            </div>

            <div className="liquid-glass rounded-2xl p-6 sm:p-8">
              <div className="mb-6 space-y-2 text-center lg:text-left">
                <h2 className="landing-title" style={{ fontSize: '1.75rem' }}>
                  {title}
                </h2>
                <p
                  className="landing-subtitle"
                  style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}
                >
                  {subtitle}
                </p>
              </div>

              {children}
            </div>

            <div className="mt-6 text-center text-sm" style={{ color: '#9ca3af' }}>
              {footer}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
