'use client';

import Link from 'next/link';
import { BigTechBackground } from './big-tech-background';
import { Kanban3DScene } from './kanban-3d-scene';
import { MARKETING_IMAGES } from './marketing-images';

const navLinks = [
  { label: 'Продукт', href: '#features' },
  { label: 'Старт', href: '#howto' },
  { label: 'Войти', href: '/login' },
];

const benefits = [
  { value: '0 ₽', label: 'старт' },
  { value: '50', label: 'участников' },
  { value: '24/7', label: 'доступ' },
];

const features = [
  {
    title: 'Kanban-доски',
    text: 'Колонки, статусы и задачи — всё на виду, без лишних кликов.',
    image: MARKETING_IMAGES.featureKanban,
    alt: 'Команда планирует задачи',
  },
  {
    title: 'Workspaces',
    text: 'Отдельные пространства для команд с ролями и приглашениями.',
    image: MARKETING_IMAGES.featureWorkspace,
    alt: 'Современный офис',
  },
  {
    title: 'Realtime-ready',
    text: 'Архитектура готова к live-обновлениям доски и задач.',
    image: MARKETING_IMAGES.featureRealtime,
    alt: 'Команда обсуждает проект',
  },
];

const steps = [
  {
    num: '01',
    title: 'Регистрация',
    text: 'Создайте аккаунт и первый workspace за пару минут.',
    cta: 'Создать аккаунт',
    href: '/register',
    variant: 'primary' as const,
    image: MARKETING_IMAGES.stepRegister,
    alt: 'Рабочее место',
  },
  {
    num: '02',
    title: 'Команда',
    text: 'Пригласите коллег по ссылке и назначьте роли.',
    cta: 'Пригласить',
    href: '/register',
    variant: 'secondary' as const,
    image: MARKETING_IMAGES.stepTeam,
    alt: 'Команда за работой',
  },
  {
    num: '03',
    title: 'Проекты',
    text: 'Запустите Kanban и ведите спринты в одном потоке.',
    cta: 'Открыть доску',
    href: '/register',
    variant: 'ghost' as const,
    image: MARKETING_IMAGES.stepProjects,
    alt: 'Планирование спринта',
  },
];

export function LandingPage() {
  return (
    <div className="tt-landing">
      <BigTechBackground />

      <div className="tt-landing__content">
        <header className="tt-nav-wrap">
          <nav className="tt-nav">
            <Link href="/" className="tt-logo">
              T-task
            </Link>

            <div className="tt-nav__links">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} className="tt-nav__link">
                  {link.label}
                </Link>
              ))}
            </div>

            <Link href="/register" className="tt-btn tt-btn--primary tt-nav__cta">
              Начать бесплатно
            </Link>
          </nav>
        </header>

        <section className="tt-hero">
          <div className="tt-hero__grid">
            <div className="tt-hero__copy">
              <h1 className="tt-hero__title">
                Проекты
                <br />
                без хаоса
              </h1>

              <p className="tt-hero__text">
                Канбан, workspaces и роли — в одном продукте. Чистый интерфейс, понятные действия,
                фокус на результате.
              </p>

              <div className="tt-hero__actions">
                <Link href="/register" className="tt-btn tt-btn--primary tt-btn--pill">
                  Начать бесплатно
                </Link>
                <Link href="/login" className="tt-btn tt-btn--secondary tt-btn--pill">
                  Войти
                </Link>
              </div>

              <div className="tt-stats">
                {benefits.map((item) => (
                  <div key={item.label} className="tt-stats__item">
                    <span className="tt-stats__value">{item.value}</span>
                    <span className="tt-stats__label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tt-hero__visual">
              <Kanban3DScene />
            </div>
          </div>
        </section>

        <section id="features" className="tt-section">
          <div className="tt-section__head">
            <h2 className="tt-section__title">Что внутри</h2>
            <p className="tt-section__subtitle">Всё нужное — без перегруза</p>
          </div>

          <div className="tt-feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="tt-feature-card">
                <div className="tt-feature-card__media">
                  <img src={feature.image} alt={feature.alt} loading="lazy" />
                </div>
                <div className="tt-feature-card__body">
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="howto" className="tt-section tt-section--panel">
          <div className="tt-section__head">
            <h2 className="tt-section__title">Как начать</h2>
            <p className="tt-section__subtitle">Три шага до первой доски</p>
          </div>

          <div className="tt-steps">
            {steps.map((step) => (
              <article key={step.num} className="tt-step-card">
                <div className="tt-step-card__media">
                  <img src={step.image} alt={step.alt} loading="lazy" />
                </div>
                <div className="tt-step-card__body">
                  <span className="tt-step-card__num">{step.num}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <Link href={step.href} className={`tt-btn tt-btn--${step.variant} tt-btn--pill`}>
                    {step.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="tt-footer">
          <p className="tt-footer__logo">T-task</p>
          <p className="tt-footer__text">Управление проектами для малых команд</p>
        </footer>
      </div>
    </div>
  );
}
