# T-task

Канбан и CRM для небольших команд. Workspaces, доски, сделки, формы, уведомления.

**Стек:** Next.js · NestJS · Prisma · PostgreSQL · Redis

## Запуск

```bash
cp .env.example .env
# сгенерируй JWT_ACCESS_SECRET:
# node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

docker compose up --build
```

- UI: http://localhost:3000
- API: http://localhost:3001/api/v1

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

|                      |                      |
| -------------------- | -------------------- |
| `frontend/`          | Next.js App Router   |
| `backend/`           | NestJS API + Prisma  |
| `docker-compose.yml` | postgres, redis, app |

## Скрипты

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
npm run prisma:migrate -w backend
```

## Заметки

- Auth через httpOnly cookies (`access_token`, `refresh_token`).
- На workspace-роутах нужен заголовок `x-workspace-id`.
- В `.env` обязательно свой `JWT_ACCESS_SECRET` (≥32 символа, не placeholder).
