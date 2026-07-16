'use client';

import Link from 'next/link';
import { BrandLogo } from './brand-logo';
import { Kanban3DScene } from './kanban-3d-scene';
import { LandingBackground } from './landing-background';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const navLinks = [
  { label: 'Возможности', href: '#features' },
  { label: 'Как начать', href: '#howto' },
  { label: 'Для кого', href: '#audiences' },
];

const logos = [
  'Product teams',
  'Digital-агентства',
  'Стартапы',
  'Удалённые команды',
  'Маркетинг',
  'Разработка',
  'Дизайн-студии',
  'Фриланс',
];

const features = [
  {
    icon: '↗',
    title: 'Приложения',
    text: 'Прикрепляйте Google Документы и Таблицы, макеты Figma, доски Miro и базы Airtable — просматривайте рабочие ресурсы прямо в T-task.',
    tone: 'green',
  },
  {
    icon: '⚡',
    title: 'Автоматизация колонок',
    text: 'Настройте действия при попадании задачи в колонку: назначьте исполнителя, запустите учёт времени или автоматически завершите работу.',
    tone: 'blue',
  },
  {
    icon: '⏰',
    title: 'Просроченные задачи',
    text: 'Следите за дедлайнами, фильтруйте просрочку и автоматически переносите задачи на следующий день — со счётчиком дней просрочки для всей команды.',
    tone: 'green',
  },
  {
    icon: '🔁',
    title: 'Повторяющиеся задачи',
    text: 'Настройте регулярное повторение — при выполнении задача автоматически создастся снова или перенесётся на следующий срок: каждый день, неделю, месяц или в выбранные дни.',
    tone: 'violet',
  },
  {
    icon: '🍅',
    title: 'Pomodoro-таймер',
    text: 'Чередуйте фокус и отдых с настраиваемыми интервалами. Звуковой сигнал напомнит переключиться — оставайтесь продуктивными без выгорания.',
    tone: 'blue',
  },
  {
    icon: '📝',
    title: 'Формы',
    text: 'Создавайте опросы с разными типами полей, делитесь ссылкой и собирайте ответы. Статистика по вариантам и автоматическое создание задач на доске.',
    tone: 'violet',
  },
  {
    icon: '🎯',
    title: 'CRM-воронки',
    text: 'Воронки работают как канбан-доски, только со сделками. Распределяйте заявки по этапам и отслеживайте путь клиента от первого контакта до покупки.',
    tone: 'green',
  },
  {
    icon: '📊',
    title: 'Аналитика',
    text: 'Контролируйте прогресс каждого участника. Выберите период и сотрудника — и изучите, над какими задачами работал человек, сравнив план и факт.',
    tone: 'green',
  },
  {
    icon: '⏱',
    title: 'Оценка времени',
    text: 'Каждую задачу можно оценить по времени. Это поможет просмотреть загрузку каждого сотрудника на день или общую загрузку по проекту. Ещё так можно сравнить план и факт трудозатрат.',
    tone: 'violet',
  },
  {
    icon: '▦',
    title: 'Kanban-доски',
    text: 'Колонки, статусы, приоритеты и дедлайны — всё на одной доске.',
    tone: 'blue',
  },
  {
    icon: '◎',
    title: 'Workspaces',
    text: 'Отдельные пространства для команд с ролями и приглашениями.',
    tone: 'blue',
  },
  {
    icon: '⚡',
    title: 'Быстрый старт',
    text: 'Регистрация, онбординг и первая доска — за пару минут.',
    tone: 'blue',
  },
];

const steps = [
  {
    num: '01',
    title: 'Создайте аккаунт',
    text: 'Укажите имя, email и пароль — без лишних полей.',
    cta: 'Регистрация',
    href: '/register',
  },
  {
    num: '02',
    title: 'Настройте команду',
    text: 'Назовите workspace, пригласите коллег и назначьте роли.',
    cta: 'Пригласить',
    href: '/register',
  },
  {
    num: '03',
    title: 'Запустите доску',
    text: 'Создавайте задачи, двигайте карточки и ведите спринты.',
    cta: 'Открыть доску',
    href: '/register',
  },
];

const audiences = [
  {
    icon: '🚀',
    title: 'Стартапам',
    text: 'Запустите первую доску за минуты — без долгой настройки и сложных инструкций.',
    tone: 'violet',
  },
  {
    icon: '🏢',
    title: 'Агентствам',
    text: 'Отдельный workspace под каждого клиента: задачи, роли и доступы не смешиваются.',
    tone: 'blue',
  },
  {
    icon: '🌍',
    title: 'Удалённым командам',
    text: 'Видно, кто за что отвечает: assignee, приоритеты, комментарии и статусы на доске.',
    tone: 'green',
  },
];

export function LandingPage() {
  return (
    <div className="tt-landing">
      <LandingBackground />

      <div className="tt-landing__content">
        <header className="tt-nav-wrap">
          <nav className="tt-nav">
            <BrandLogo />

            <div className="tt-nav__links">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} className="tt-nav__link">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="tt-nav__actions">
              <ThemeToggle />
              <Link href="/login" className="tt-nav__login">
                Войти
              </Link>
              <Link href="/register" className="tt-btn tt-btn--primary tt-nav__cta">
                Начать бесплатно
              </Link>
            </div>
          </nav>
        </header>

        <section className="tt-hero tt-hero--centered">
          <div className="tt-hero__copy">
            <h1 className="tt-hero__title">
              Виртуальный офис
              <br />
              для ваших задач
            </h1>
            <p className="tt-hero__text">
              Канбан-доски, workspaces и роли в одном сервисе — прозрачные процессы, понятный
              интерфейс и фокус на результате.
            </p>
            <div className="tt-hero__actions">
              <Link href="/register" className="tt-btn tt-btn--primary tt-btn--pill tt-btn--lg">
                Начать бесплатно
              </Link>
              <Link href="#demo" className="tt-btn tt-btn--secondary tt-btn--pill tt-btn--lg">
                Попробовать демо
              </Link>
            </div>
          </div>

          <div className="tt-marquee" aria-hidden="true">
            <div className="tt-marquee__track">
              {[...logos, ...logos].map((logo, index) => (
                <span key={`${logo}-${index}`} className="tt-marquee__item">
                  {logo}
                </span>
              ))}
            </div>
          </div>

          <div id="demo" className="tt-hero__demo">
            <Kanban3DScene />
          </div>
        </section>

        <section id="features" className="tt-section">
          <div className="tt-section__head tt-section__head--center">
            <h2 className="tt-section__title">Всё для работы команды</h2>
            <p className="tt-section__subtitle">
              Несколько инструментов в одном месте — без лишней сложности
            </p>
          </div>

          <div className="tt-feature-grid">
            {features.map((feature) => (
              <article
                key={feature.title}
                className={`tt-feature-card tt-feature-card--${feature.tone}`}
              >
                <span className="tt-feature-card__icon" aria-hidden="true">
                  {feature.icon}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="howto" className="tt-section tt-section--panel">
          <div className="tt-section__head tt-section__head--center">
            <h2 className="tt-section__title">Как начать</h2>
            <p className="tt-section__subtitle">Три шага до первой доски</p>
          </div>

          <div className="tt-steps">
            {steps.map((step) => (
              <article key={step.num} className="tt-step-card">
                <span className="tt-step-card__num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <Link href={step.href} className="tt-step-card__link">
                  {step.cta} →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section id="audiences" className="tt-section">
          <div className="tt-section__head tt-section__head--center">
            <h2 className="tt-section__title">Для кого подходит</h2>
            <p className="tt-section__subtitle">
              T-task заточен под небольшие команды, которым нужен порядок без перегруза
            </p>
          </div>

          <div className="tt-audience-grid">
            {audiences.map((audience) => (
              <article
                key={audience.title}
                className={`tt-audience-card tt-audience-card--${audience.tone}`}
              >
                <span className="tt-audience-card__icon" aria-hidden="true">
                  {audience.icon}
                </span>
                <h3>{audience.title}</h3>
                <p>{audience.text}</p>
                <Link href="/register" className="tt-audience-card__link">
                  Начать бесплатно →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="tt-cta-banner">
          <div className="tt-cta-banner__inner">
            <div className="tt-cta-banner__copy">
              <h2>Готовы навести порядок в задачах?</h2>
              <p>Бесплатный старт для команд до 50 человек. Без карты.</p>
            </div>
            <Link href="/register" className="tt-btn tt-btn--primary tt-btn--pill tt-btn--lg">
              Начать бесплатно
            </Link>
          </div>
        </section>

        <footer className="tt-footer">
          <div className="tt-footer__inner">
            <div>
              <p className="tt-footer__logo">T-task</p>
              <p className="tt-footer__text">Управление проектами для малых команд</p>
            </div>
            <div className="tt-footer__links">
              <Link href="/login">Войти</Link>
              <Link href="/register">Регистрация</Link>
              <Link href="#features">Возможности</Link>
              <Link href="#audiences">Для кого</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
