# T-task

Канбан и CRM для небольших команд. Workspaces, доски, сделки, формы, уведомления.

**Стек:** Next.js, NestJS, Prisma, PostgreSQL, Redis

## Запуск

```bash
cp .env.example .env
# сгенерируй JWT_ACCESS_SECRET:
# node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

docker compose up --build
```

- UI: http://localhost:3000
- API: http://localhost:3001/api/v1

Локальный Docker явно ставит `ALLOW_INSECURE_DEV=true` (dev cookies / без HSTS).  
**Прод** — только с production-постурой:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

В `.env` для прода обязательны сильный `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_ACCESS_SECRET`, `CORS_ORIGIN` (https).  
Прод не публикует Postgres/Redis/PgBouncer наружу; локально они слушаются только на `127.0.0.1`.

### Без Docker

Нужны PostgreSQL и Redis (можно `docker compose up postgres redis`).

```bash
npm install
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run dev:backend   # :3001
npm run dev:frontend  # :3000
```

## Что внутри

|                           |                     |
| ------------------------- | ------------------- |
| `frontend/`               | Next.js App Router  |
| `backend/`                | NestJS API + Prisma |
| `docker-compose.yml`      | local stack (dev)   |
| `docker-compose.prod.yml` | production overlay  |

## Скрипты

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
npm run prisma:migrate -w backend
```

## Заметки

- Auth через httpOnly cookies (`access_token`, `refresh_token`). В production cookies `Secure`, включены HSTS/CSP и Origin CSRF.
- На workspace-роутах нужен заголовок `x-workspace-id`.
- В `.env` обязательно свой `JWT_ACCESS_SECRET` (≥32 символа, не placeholder).
- Для ИИ (чат и помощник в задаче): задайте `AI_TOKEN_ENC_KEY` (base64, 32 байта) и вставьте API-токен в настройках команды.
