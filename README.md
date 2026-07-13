# T-task

SaaS для управления проектами небольшими командами. Этот репозиторий содержит **инфраструктурный каркас** без бизнес-логики.

## Стек

| Слой     | Технологии                                                              |
| -------- | ----------------------------------------------------------------------- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Backend  | NestJS, Prisma, PostgreSQL, Redis, JWT (инфраструктура)                 |
| DevOps   | Docker, Docker Compose, ESLint, Prettier, Husky                         |

## Структура

```
T-task/
├── backend/          # NestJS API (модульный монолит)
│   ├── prisma/       # Prisma schema и миграции
│   └── src/
│       ├── common/           # Envelope, filters, interceptors
│       ├── config/           # Env validation
│       ├── domain-events/    # Доменные события (заглушка)
│       ├── infrastructure/   # Prisma, Redis
│       └── modules/          # Feature modules (заглушки)
├── frontend/         # Next.js App Router
│   └── src/
│       ├── app/              # Routes и layouts
│       ├── components/ui/    # UI primitives (заглушка)
│       ├── features/         # Feature-based slices
│       ├── providers/        # React providers
│       ├── shared/           # API client, query, lib
│       ├── stores/           # Zustand UI state
│       └── types/            # Shared types
├── docker-compose.yml
├── .env.example
└── package.json      # npm workspaces (root)
```

## Быстрый старт

### 1. Подготовка окружения

```bash
cp .env.example .env
```

### 2. Запуск всего проекта одной командой

```bash
docker compose up --build
```

После старта:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Health: http://localhost:3001/health/live

### 3. Локальная разработка (без Docker)

```bash
# Установка зависимостей
npm install

# PostgreSQL и Redis должны быть доступны (или через docker compose up postgres redis)
npm run prisma:generate -w backend
npm run prisma:migrate -w backend

# Запуск backend и frontend
npm run dev:backend
npm run dev:frontend
```

## Скрипты

| Команда                             | Описание                           |
| ----------------------------------- | ---------------------------------- |
| `npm run dev`                       | Запуск всех workspace в dev-режиме |
| `npm run build`                     | Сборка backend и frontend          |
| `npm run lint`                      | ESLint во всех пакетах             |
| `npm run format`                    | Prettier format                    |
| `npm run prisma:migrate -w backend` | Prisma migrate dev                 |
| `npm run prisma:studio -w backend`  | Prisma Studio                      |

## Архитектурные принципы

- **Модульный монолит** — один NestJS-процесс с чёткими bounded contexts.
- **Feature-based frontend** — доменная логика в `src/features/*`.
- **Единый API envelope** — `{ success, data, error, meta? }`.
- **Tenant isolation** — `workspaceId` на всех tenant-сущностях (будет в фазе данных).
- **Server state** — TanStack Query; Zustand только для UI-состояния.

## Что уже есть

- Docker Compose: PostgreSQL, Redis, backend, frontend
- Prisma с пустой схемой и начальной миграцией
- NestJS: config validation, global filters, response envelope, health checks
- Next.js: App Router, Tailwind, React Query provider
- ESLint + Prettier + Husky (pre-commit lint-staged)

## Auth API (Фаза 1)

| Метод | Путь                      | Описание                                 |
| ----- | ------------------------- | ---------------------------------------- |
| POST  | `/api/v1/auth/register`   | Регистрация + создание первого workspace |
| POST  | `/api/v1/auth/login`      | Вход                                     |
| POST  | `/api/v1/auth/refresh`    | Ротация refresh-токена                   |
| POST  | `/api/v1/auth/logout`     | Выход из текущей сессии                  |
| POST  | `/api/v1/auth/logout-all` | Выход со всех устройств (требует auth)   |
| GET   | `/api/v1/auth/me`         | Текущий пользователь и workspaces        |

Токены хранятся в **HttpOnly cookies** (`access_token`, `refresh_token`).

## Workspaces API (Фаза 2)

| Метод  | Путь                                       | Роли         | Описание                   |
| ------ | ------------------------------------------ | ------------ | -------------------------- |
| GET    | `/api/v1/workspaces`                       | auth         | Список команд пользователя |
| POST   | `/api/v1/workspaces`                       | auth         | Создать команду            |
| GET    | `/api/v1/workspaces/:id`                   | VIEWER+      | Детали команды             |
| PATCH  | `/api/v1/workspaces/:id`                   | ADMIN, OWNER | Обновить название          |
| POST   | `/api/v1/workspaces/:id/archive`           | ADMIN, OWNER | Архивировать               |
| DELETE | `/api/v1/workspaces/:id`                   | OWNER        | Удалить (soft)             |
| GET    | `/api/v1/workspaces/:id/members`           | VIEWER+      | Участники                  |
| PATCH  | `/api/v1/workspaces/:id/members/:memberId` | ADMIN, OWNER | Сменить роль               |
| DELETE | `/api/v1/workspaces/:id/members/:memberId` | ADMIN, OWNER | Исключить                  |
| GET    | `/api/v1/workspaces/:id/invitations`       | ADMIN, OWNER | Активные приглашения       |
| POST   | `/api/v1/workspaces/:id/invitations`       | ADMIN, OWNER | Пригласить по email        |
| DELETE | `/api/v1/workspaces/:id/invitations/:id`   | ADMIN, OWNER | Отозвать                   |
| GET    | `/api/v1/invitations/:token`               | public       | Превью приглашения         |
| POST   | `/api/v1/invitations/:token/accept`        | auth         | Принять приглашение        |

Заголовок `x-workspace-id` используется для tenant-контекста на защищённых маршрутах.

После обновления схемы выполните миграцию:

```bash
npm run prisma:migrate:deploy -w backend
```

## Что будет дальше

Бизнес-логика реализуется поэтапно: Projects → Boards → Tasks → Realtime → Collaboration.

См. архитектурный документ в `docs/architecture.md`.
