'use client';

import Link from 'next/link';
import { TeamMomentumBackground } from './team-momentum-background';

const navLinks = [
  { label: 'Главная', href: '/', active: true },
  { label: 'Возможности', href: '#features' },
  { label: 'Команды', href: '#teams' },
  { label: 'Войти', href: '/login' },
];

export function LandingPage() {
  return (
    <div className="landing-page">
      <TeamMomentumBackground />

      <div className="landing-content">
        <header className="landing-nav">
          <Link href="/" className="landing-logo">
            T-task<sup>®</sup>
          </Link>

          <nav className="landing-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={link.active ? 'landing-nav-link is-active' : 'landing-nav-link'}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link href="/register" className="liquid-glass landing-nav-cta">
            Начать бесплатно
          </Link>
        </header>

        <section className="landing-hero">
          <p className="landing-eyebrow animate-fade-rise">Для команд, которые двигаются вперёд</p>

          <h1 className="landing-title animate-fade-rise">
            Где <em>задачи</em> поднимаются <em>через фокус.</em>
          </h1>

          <p className="landing-subtitle animate-fade-rise-delay">
            T-task — пространство для ясных целей, слаженной работы и реального прогресса. Канбан,
            команды и роли — без шума и перегруза.
          </p>

          <div className="landing-actions animate-fade-rise-delay-2">
            <Link href="/register" className="liquid-glass landing-cta">
              Начать бесплатно
            </Link>
            <Link href="/login" className="landing-cta-secondary">
              У меня есть аккаунт
            </Link>
          </div>

          <div className="landing-stats animate-fade-rise-delay-2">
            <span>Бесплатный старт</span>
            <span>До 50 участников</span>
            <span>Self-hosted ready</span>
          </div>
        </section>
      </div>
    </div>
  );
}
