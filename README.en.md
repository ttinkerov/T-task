# T-task

[Русский](README.md) | **English**

Kanban and CRM for small teams. Workspaces, boards, deals, forms, and notifications.

**Stack:** Next.js (App Router) + Vue islands, NestJS, Prisma, PostgreSQL, Redis

## Features

- **Workspaces** — teams, roles, invites, scopes
- **Boards** — columns, drag-and-drop, WIP limits, automations, filters
- **Tasks** — subtasks, tags, comments, @mentions, watchers, epics, sprints
- **My Tasks** — assigned / watching / overdue / due soon
- **Roadmap / Epic board / Focus** — planning and deep work
- **CRM** — pipelines, deals, link to tasks
- **Forms** — public forms → tasks / deals
- **Definition of Done / Templates** — checklists and card templates
- **Analytics** — throughput, cycle time, workload
- **Calendar / Import / AI / Trash** — iCal feed, CSV, RAG assistant, soft-delete
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
├── frontend/                 # Next.js shell + Vue islands (UI)
├── backend/                  # NestJS API + Prisma + jobs
├── docker-compose.yml        # local stack (dev)
└── docker-compose.prod.yml   # production overlay
```

Next.js is the app shell; Vue powers the interactive screens (`VueIsland`).

## Scripts

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e:smoke
npm run prisma:migrate -w backend
```

## License

[MIT](LICENSE) © 2026 ttinkerov
