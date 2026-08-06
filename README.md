# T-task

**Русский** | [English](README.en.md)

Канбан и CRM для небольших команд. Workspaces, доски, сделки, формы, уведомления.

**Стек:** Next.js, NestJS, Vue, Prisma, PostgreSQL, Redis

## Возможности

- **Workspaces** — команды, роли, инвайты, scopes
- **Boards** — колонки, DnD, WIP, автоматизации, фильтры
- **Tasks** — сабтаски, теги, комментарии, @mentions, watchers, эпики, спринты
- **My Tasks** — назначенные / слежу / просрочка / скоро дедлайн
- **CRM** — воронки, сделки, связь со задачами
- **Forms** — публичные формы → задачи / сделки
- **DoD / Templates** — чеклисты и шаблоны карточек
- **Analytics** — throughput, cycle time, workload
- **Apps** — календарь iCal, импорт, AI-помощник, корзина
- **Whiteboard** — рисование (tldraw), автосохранение на workspace

## Запуск

```bash
cp .env.example .env
# Сгенерируй JWT_ACCESS_SECRET:
# node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

docker compose up --build
```

- UI: http://localhost:3000
- API: http://localhost:3001/api/v1

Локальный Docker ставит `ALLOW_INSECURE_DEV=true`.

**Прод** — только с production-постурой:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### Без Docker

Нужны PostgreSQL и Redis (можно `docker compose up postgres redis`).

```bash
npm install
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run dev:backend   # :3001
npm run dev:frontend  # :3000
```

## Структура

```text
T-task/
├── frontend/                 # Next.js App Router
├── backend/                  # NestJS API + Prisma
├── docker-compose.yml        # локальный стек (dev)
└── docker-compose.prod.yml   # production overlay
```

## Скрипты

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
npm run prisma:migrate -w backend
```

## Лицензия

[MIT](LICENSE) © 2026 ttinkerov
