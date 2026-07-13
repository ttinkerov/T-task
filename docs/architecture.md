# T-task Architecture

Этот документ — краткая выжимка утверждённой архитектуры. Полная версия доступна в Cursor Canvas: `t-task-architecture.canvas.tsx`.

## Ключевые решения

- **Модульный монолит** на NestJS (не микросервисы)
- **Workspace** = tenant (multi-tenancy через `workspaceId`)
- **PostgreSQL** — единственный durable source of truth
- **Redis** — cache, rate limits, presence, WebSocket pub/sub
- **Task.status** — ссылка на `BoardColumn`, не enum
- **REST** — командный источник истины; WebSocket — push-синхронизация

## Backend modules

| Модуль        | Ответственность             |
| ------------- | --------------------------- |
| identity      | Auth, JWT, sessions         |
| workspaces    | Teams, members, invitations |
| projects      | Projects, visibility        |
| boards        | Boards, columns, workflow   |
| tasks         | Tasks, assignees, labels    |
| comments      | Comments, mentions          |
| notifications | In-app inbox                |
| activity      | Activity feed, audit        |
| realtime      | WebSocket gateway           |

## API prefix

- REST: `/api/v1/*`
- Health: `/health/live`, `/health/ready` (вне prefix)

## MVP scope

Auth, workspaces, projects, kanban boards, tasks, comments, in-app notifications, realtime sync.

## Deferred

Attachments (S3), email notifications, subtasks, custom fields, full-text search engine, sprints, billing, OAuth/SSO, webhooks.
