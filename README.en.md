# T-task

[Русский](README.md) | **English**

Kanban and CRM for small teams. Workspaces, boards, deals, forms, and notifications.

**Stack:** Next.js, NestJS, Vue, Prisma, PostgreSQL, Redis

## Features

- **Workspaces** — teams, roles, invites, scopes
- **Boards** — columns, drag-and-drop, WIP limits, automations, filters
- **Tasks** — subtasks, tags, comments, @mentions, watchers, epics, sprints
- **My Tasks** — assigned / watching / overdue / due soon
- **CRM** — pipelines, deals, link to tasks
- **Forms** — public forms → tasks / deals
- **DoD / Templates** — checklists and card templates
- **Analytics** — throughput, cycle time, workload
- **Apps** — iCal calendar feed, import, AI assistant, trash
- **Whiteboard** — drawing (tldraw), autosave per workspace

## Quick start

```bash
cp .env.example .env
# Generate JWT_ACCESS_SECRET:
# node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

docker compose up --build
```

- UI: http://localhost:3000
- API: http://localhost:3001/api/v1

Local Docker sets `ALLOW_INSECURE_DEV=true`.

**Production** — use the production overlay only:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### Without Docker

You need PostgreSQL and Redis (or `docker compose up postgres redis`).

```bash
npm install
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run dev:backend   # :3001
npm run dev:frontend  # :3000
```

## Structure

```text
T-task/
├── frontend/                 # Next.js App Router
├── backend/                  # NestJS API + Prisma
├── docker-compose.yml        # local stack (dev)
└── docker-compose.prod.yml   # production overlay
```

## Scripts

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
npm run prisma:migrate -w backend
```

## License

[MIT](LICENSE) © 2026 ttinkerov
