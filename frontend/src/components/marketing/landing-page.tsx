'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  FormInput,
  Kanban,
  Layers3,
  Repeat2,
  Rocket,
  Timer,
  Workflow,
  Globe2,
} from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from './brand-logo';
import { Kanban3DScene } from './kanban-3d-scene';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const navLinks = [
  { label: 'Возможности', href: '#features' },
  { label: 'Как начать', href: '#howto' },
  { label: 'Для кого', href: '#audiences' },
];

const features = [
  {
    icon: Kanban,
    title: 'Kanban без шума',
    text: 'Колонки, приоритеты, теги и дедлайны — плотный интерфейс, который не мешает думать.',
  },
  {
    icon: Workflow,
    title: 'Автоматизация колонок',
    text: 'Назначение, таймер и завершение срабатывают сами, когда карточка попадает в нужный статус.',
  },
  {
    icon: ClipboardList,
    title: 'CRM-воронки',
    text: 'Сделки живут рядом с задачами. Связывайте заявки и работу команды без отдельного зоопарка инструментов.',
  },
  {
    icon: CalendarClock,
    title: 'Дедлайны и напоминания',
    text: 'Просрочка видна сразу. Напоминания о сроках приходят в колокольчик, а не теряются в почте.',
  },
  {
    icon: Repeat2,
    title: 'Повторяющиеся задачи',
    text: 'Ежедневные и недельные ритмы: задача сама возвращается после завершения.',
  },
  {
    icon: FormInput,
    title: 'Формы → задачи',
    text: 'Публичные формы собирают заявки и при желании сразу кладут их на доску.',
  },
  {
    icon: BarChart3,
    title: 'Аналитика нагрузки',
    text: 'План и факт по людям и периодам — без тяжёлых отчётов «ради отчётов».',
  },
  {
    icon: Timer,
    title: 'Фокус и Pomodoro',
    text: 'Встроенный таймер помогает держать ритм, когда день расползается на мелочи.',
  },
  {
    icon: Layers3,
    title: 'Несколько досок',
    text: 'Проекты внутри workspace переключаются мгновенно — без потери контекста.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Создайте аккаунт',
    text: 'Имя, email, пароль — и вы внутри. Без онбординга на полчаса.',
  },
  {
    num: '02',
    title: 'Соберите команду',
    text: 'Workspace, роли и приглашения. Каждый видит только своё пространство.',
  },
  {
    num: '03',
    title: 'Запустите доску',
    text: 'Карточки, фильтры, ⌘K и чекбоксы — как в инструментах, к которым уже привыкли.',
  },
];

const audiences = [
  {
    icon: Rocket,
    title: 'Стартапам',
    text: 'Первая доска за минуты. Скорость важнее «enterprise-настроек».',
  },
  {
    icon: Building2,
    title: 'Агентствам',
    text: 'Отдельный workspace на клиента: задачи и доступы не смешиваются.',
  },
  {
    icon: Globe2,
    title: 'Удалённым командам',
    text: 'Assignee, статусы и активность — видно, кто за что отвечает сегодня.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export function LandingPage() {
  return (
    <div className="tt-landing">
      <div className="tt-landing-glow" aria-hidden="true" />

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

        <section className="tt-hero">
          <motion.div
            className="tt-hero__copy"
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.08 }}
          >
            <motion.h1 className="tt-hero__brand" variants={fadeUp}>
              T-task
            </motion.h1>
            <motion.p className="tt-hero__title" variants={fadeUp}>
              Задачи, которые ощущаются
              <br />
              дорого в руках
            </motion.p>
            <motion.p className="tt-hero__text" variants={fadeUp}>
              Канбан, CRM и фокус в одном плотном интерфейсе — без шаблонного SaaS-шума.
            </motion.p>
            <motion.div className="tt-hero__actions" variants={fadeUp}>
              <Link href="/register" className="tt-btn tt-btn--primary tt-btn--lg">
                Начать бесплатно
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </Link>
              <Link href="#demo" className="tt-btn tt-btn--secondary tt-btn--lg">
                Смотреть продукт
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            id="demo"
            className="tt-hero__stage"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="tt-hero__stage-chrome">
              <span />
              <span />
              <span />
              <em>Доска · Live preview</em>
            </div>
            <div className="tt-hero__stage-body">
              <Kanban3DScene />
            </div>
          </motion.div>
        </section>

        <section id="features" className="tt-section">
          <div className="tt-section__head">
            <p className="tt-section__eyebrow">Возможности</p>
            <h2 className="tt-section__title">Всё нужное — и ничего лишнего</h2>
            <p className="tt-section__subtitle">
              Инструмент на каждый день: плотный, спокойный, с тактильным откликом.
            </p>
          </div>

          <div className="tt-feature-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  className="tt-feature-card"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="tt-feature-card__icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section id="howto" className="tt-section tt-section--panel">
          <div className="tt-section__head">
            <p className="tt-section__eyebrow">Старт</p>
            <h2 className="tt-section__title">Три шага до первой доски</h2>
          </div>

          <div className="tt-steps">
            {steps.map((step, index) => (
              <motion.article
                key={step.num}
                className="tt-step-card"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
              >
                <span className="tt-step-card__num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="audiences" className="tt-section">
          <div className="tt-section__head">
            <p className="tt-section__eyebrow">Аудитория</p>
            <h2 className="tt-section__title">Для кого подходит</h2>
            <p className="tt-section__subtitle">
              Малые команды, которым нужен порядок без корпоративного перегруза.
            </p>
          </div>

          <div className="tt-audience-grid">
            {audiences.map((audience, index) => {
              const Icon = audience.icon;
              return (
                <motion.article
                  key={audience.title}
                  className="tt-audience-card"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                >
                  <span className="tt-audience-card__icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <h3>{audience.title}</h3>
                  <p>{audience.text}</p>
                  <Link href="/register" className="tt-audience-card__link">
                    Начать бесплатно
                    <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="tt-cta-banner">
          <div className="tt-cta-banner__inner">
            <div className="tt-cta-banner__copy">
              <h2>Готовы навести порядок в задачах?</h2>
              <p>Бесплатный старт для команд. Без карты и без «enterprise-демо».</p>
            </div>
            <Link href="/register" className="tt-btn tt-btn--primary tt-btn--lg">
              Создать workspace
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <footer className="tt-footer">
          <div className="tt-footer__inner">
            <div>
              <BrandLogo href="/" />
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
