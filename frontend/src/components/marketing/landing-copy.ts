import type { AppLocale } from '@/stores/locale.store';

export type LandingCopy = {
  nav: {
    features: string;
    ai: string;
    audiences: string;
    login: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    text: string;
    start: string;
    watch: string;
    stageUrl: string;
    tabNew: string;
  };
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ title: string; text: string }>;
  };
  ai: {
    titleLine1: string;
    titleLine2: string;
    text: string;
    cta: string;
    items: Array<{ title: string; text: string }>;
  };
  audiences: {
    eyebrow: string;
    title: string;
    subtitle: string;
    start: string;
    items: Array<{ title: string; text: string }>;
  };
  cta: {
    title: string;
    text: string;
    button: string;
  };
  footer: {
    text: string;
    login: string;
    register: string;
    features: string;
    ai: string;
    audiences: string;
  };
  language: {
    label: string;
    ru: string;
    en: string;
  };
};

const ru: LandingCopy = {
  nav: {
    features: 'Возможности',
    ai: 'ИИ',
    audiences: 'Для кого',
    login: 'Войти',
  },
  hero: {
    titleLine1: 'Задачи, которые ощущаются',
    titleLine2: 'дорого в руках',
    text: 'Доска, сделки, ИИ и режим фокуса - всё в одном месте.',
    start: 'Начать',
    watch: 'Смотреть продукт',
    stageUrl: 't-task/dashboard/board',
    tabNew: 'Новая вкладка',
  },
  features: {
    eyebrow: 'Возможности',
    title: 'Всё нужное - и ничего лишнего',
    subtitle: 'Инструмент на каждый день: плотный, спокойный, с тактильным откликом.',
    items: [
      {
        title: 'Kanban без шума',
        text: 'Колонки, приоритеты, теги и дедлайны - плотный интерфейс, который не мешает думать.',
      },
      {
        title: 'Автоматизация колонок',
        text: 'Назначение, таймер и завершение срабатывают сами, когда карточка попадает в нужный статус.',
      },
      {
        title: 'CRM-воронки',
        text: 'Сделки живут рядом с задачами. Связывайте заявки и работу команды без отдельного зоопарка инструментов.',
      },
      {
        title: 'Дедлайны и напоминания',
        text: 'Просрочка видна сразу. Напоминания о сроках приходят в колокольчик, а не теряются в почте.',
      },
      {
        title: 'Повторяющиеся задачи',
        text: 'Ежедневные и недельные ритмы: задача сама возвращается после завершения.',
      },
      {
        title: 'Формы → задачи',
        text: 'Публичные формы собирают заявки и при желании сразу кладут их на доску.',
      },
      {
        title: 'Аналитика нагрузки',
        text: 'План и факт по людям и периодам - без тяжёлых отчётов «ради отчётов».',
      },
      {
        title: 'Фокус и Pomodoro',
        text: 'Встроенный таймер помогает держать ритм, когда день расползается на мелочи.',
      },
      {
        title: 'ИИ-чат и помощник',
        text: 'Разбивает задачи, правит формулировки и отвечает в контексте доски - достаточно вставить API-токен.',
      },
      {
        title: 'Несколько досок',
        text: 'Проекты внутри workspace переключаются мгновенно - без потери контекста.',
      },
    ],
  },
  ai: {
    titleLine1: 'Не «ещё один чат».',
    titleLine2: 'Помощник по задачам.',
    text: 'Вставьте свой токен OpenAI, OpenRouter или Groq - и команда получает ИИ-чат плюс ассистента прямо в карточке задачи. Токен хранится на сервере в зашифрованном виде.',
    cta: 'Попробовать с ИИ',
    items: [
      {
        title: 'ИИ-чат в workspace',
        text: 'Приоритизация, формулировки, план спринта - без ухода в сторонний бот.',
      },
      {
        title: 'Помощник в задаче',
        text: 'Подзадачи, критерии готовности и риски - по кнопке «Спросить ИИ».',
      },
      {
        title: 'Свой токен - свой провайдер',
        text: 'OpenAI / OpenRouter / Groq / custom. Один раз вставил - команда пользуется.',
      },
    ],
  },
  audiences: {
    eyebrow: 'Аудитория',
    title: 'Для кого подходит',
    subtitle: 'Малые команды, которым нужен порядок без корпоративного перегруза.',
    start: 'Начать',
    items: [
      {
        title: 'Стартапам',
        text: 'Первая доска за минуты. Скорость важнее «enterprise-настроек».',
      },
      {
        title: 'Агентствам',
        text: 'Отдельный workspace на клиента: задачи и доступы не смешиваются.',
      },
      {
        title: 'Удалённым командам',
        text: 'Assignee, статусы и активность - видно, кто за что отвечает сегодня.',
      },
    ],
  },
  cta: {
    title: 'Готовы навести порядок в задачах?',
    text: 'Бесплатный старт для команд. Без карты и без «enterprise-демо».',
    button: 'Создать workspace',
  },
  footer: {
    text: 'Управление проектами для малых команд',
    login: 'Войти',
    register: 'Регистрация',
    features: 'Возможности',
    ai: 'ИИ',
    audiences: 'Для кого',
  },
  language: {
    label: 'Язык',
    ru: 'RU',
    en: 'EN',
  },
};

const en: LandingCopy = {
  nav: {
    features: 'Features',
    ai: 'AI',
    audiences: 'Who it’s for',
    login: 'Sign in',
  },
  hero: {
    titleLine1: 'Tasks that feel',
    titleLine2: 'premium in your hands',
    text: 'Boards, deals, AI, and a focus mode - together in one place.',
    start: 'Get started',
    watch: 'See the product',
    stageUrl: 't-task/dashboard/board',
    tabNew: 'New Tab',
  },
  features: {
    eyebrow: 'Features',
    title: 'Everything you need - nothing extra',
    subtitle: 'A daily driver: dense, calm, with tactile feedback.',
    items: [
      {
        title: 'Kanban without noise',
        text: 'Columns, priorities, tags, and due dates - a dense UI that stays out of your way.',
      },
      {
        title: 'Column automation',
        text: 'Assignment, timers, and completion fire when a card enters the right status.',
      },
      {
        title: 'CRM pipelines',
        text: 'Deals live next to tasks. Connect leads and team work without another tool zoo.',
      },
      {
        title: 'Deadlines and reminders',
        text: 'Overdue is obvious. Due reminders land in the bell, not lost in email.',
      },
      {
        title: 'Recurring tasks',
        text: 'Daily and weekly rhythms: the task returns itself after completion.',
      },
      {
        title: 'Forms → tasks',
        text: 'Public forms collect responses and can drop them straight onto the board.',
      },
      {
        title: 'Workload analytics',
        text: 'Plan vs actual by people and periods - without report theater.',
      },
      {
        title: 'Focus and Pomodoro',
        text: 'A built-in timer helps hold the rhythm when the day frays into busywork.',
      },
      {
        title: 'AI chat and assistant',
        text: 'Breaks down work, rewrites copy, and answers in board context - just drop in an API token.',
      },
      {
        title: 'Multiple boards',
        text: 'Projects inside a workspace switch instantly without losing context.',
      },
    ],
  },
  ai: {
    titleLine1: 'Not “another chat”.',
    titleLine2: 'A task assistant.',
    text: 'Paste your OpenAI, OpenRouter, or Groq token - and the team gets AI chat plus an assistant inside the task card. The token is stored encrypted on the server.',
    cta: 'Try with AI',
    items: [
      {
        title: 'AI chat in the workspace',
        text: 'Prioritization, wording, sprint planning - without leaving for a side bot.',
      },
      {
        title: 'Assistant on the task',
        text: 'Subtasks, definition of done, and risks - via “Ask AI”.',
      },
      {
        title: 'Your token, your provider',
        text: 'OpenAI / OpenRouter / Groq / custom. Set once - the whole team uses it.',
      },
    ],
  },
  audiences: {
    eyebrow: 'Audience',
    title: 'Who it’s for',
    subtitle: 'Small teams that want order without enterprise overload.',
    start: 'Get started',
    items: [
      {
        title: 'Startups',
        text: 'First board in minutes. Speed beats enterprise settings.',
      },
      {
        title: 'Agencies',
        text: 'A workspace per client: tasks and access stay separate.',
      },
      {
        title: 'Remote teams',
        text: 'Assignee, status, and activity - clear ownership for today.',
      },
    ],
  },
  cta: {
    title: 'Ready to get tasks under control?',
    text: 'Free start for teams. No card and no “enterprise demo”.',
    button: 'Create a workspace',
  },
  footer: {
    text: 'Project management for small teams',
    login: 'Sign in',
    register: 'Sign up',
    features: 'Features',
    ai: 'AI',
    audiences: 'Who it’s for',
  },
  language: {
    label: 'Language',
    ru: 'RU',
    en: 'EN',
  },
};

export const landingCopyByLocale: Record<AppLocale, LandingCopy> = { ru, en };

export function getLandingCopy(locale: AppLocale): LandingCopy {
  return landingCopyByLocale[locale] ?? landingCopyByLocale.ru;
}
