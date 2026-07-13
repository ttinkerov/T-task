import Link from 'next/link';
import type { ReactNode } from 'react';
import { BigTechBackground } from './big-tech-background';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="tt-landing">
      <BigTechBackground />

      <div className="tt-landing__content tt-auth">
        <header className="tt-nav-wrap">
          <nav className="tt-nav tt-auth__nav">
            <Link href="/" className="tt-logo">
              T-task
            </Link>
            <Link href="/register" className="tt-btn tt-btn--primary tt-btn--pill tt-nav__cta">
              Регистрация
            </Link>
          </nav>
        </header>

        <section className="tt-auth__main">
          <div className="tt-auth__card">
            <div className="tt-auth__head">
              <h1 className="tt-auth__title">{title}</h1>
              <p className="tt-auth__subtitle">{subtitle}</p>
            </div>
            {children}
          </div>
          <div className="tt-auth__footer">{footer}</div>
        </section>
      </div>
    </div>
  );
}
