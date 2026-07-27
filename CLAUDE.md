# TallinnCruises — Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

Main deliverable: **Tallinn Shore Tours** (`artifacts/tallinn-shore-tours`) — a static
landing page for private shore excursions in Tallinn aimed at cruise passengers.
The site is a single self-contained `index.html` (HTML + CSS + JS) served by Vite.

> **Note**: this project was originally scaffolded on Replit.com. It now runs on a
> self-hosted Linux server (Docker host, project path `/docker/projects/TallinnCruises`).
> Replit-specific files (`.replit`, `.replitignore`, `@replit/*` Vite plugins) are kept
> for reference but are inactive outside Replit — the plugins only load when `REPL_ID`
> is set in the environment.

## Environment (this server)

- **OS**: Linux (Docker host with Traefik as reverse proxy for other projects)
- **Node.js**: v20 installed system-wide (repo originally targeted Node 24 — works fine)
- **pnpm**: v10 via corepack (`corepack prepare pnpm@10 --activate`); pnpm 11 requires Node 22+
- **Project path**: `/docker/projects/TallinnCruises`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Package manager**: pnpm 10
- **TypeScript version**: 5.9
- **Frontend build**: Vite 7
- **API framework**: Express 5 (scaffold only — health check route)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Workspace layout

- `artifacts/tallinn-shore-tours` — the website (Vite, single-page static)
- `artifacts/api-server` — Express 5 API scaffold
- `artifacts/mockup-sandbox` — UI mockup sandbox (shadcn/ui)
- `lib/db`, `lib/api-spec`, `lib/api-zod`, `lib/api-client-react` — shared packages
- `attached_assets` — screenshots/notes from the original Replit sessions

## Required environment variables

All project credentials/config live in `.env` at the repo root (git-ignored,
mode 600). `.env.example` is the committed template.

`artifacts/tallinn-shore-tours/vite.config.ts` refuses to start without:

- `PORT` — dev/preview server port (e.g. `5173`)
- `BASE_PATH` — base public path (use `/` for root)

Load them with e.g. `set -a; . ./.env; set +a` before running pnpm commands,
or prefix the command (`PORT=5173 BASE_PATH=/ pnpm ...`).

### Stripe

Payments will use Stripe, starting in the **sandbox/test** environment.
Keys live in `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET` (plus `STRIPE_CURRENCY`, `STRIPE_MODE=test`).

- Only test keys (`sk_test_…` / `pk_test_…`) belong in this file.
- Write secrets with `./deploy/set-env-secret.sh STRIPE_SECRET_KEY` — it reads
  the value with hidden input, so it never lands in shell history.
- `STRIPE_SECRET_KEY` is server-side only — it must never reach the frontend
  bundle. Only the publishable key may be exposed to the browser.
- Payments need the API server (`artifacts/api-server`) to be wired up first:
  the site is currently static, so there is no backend to create
  PaymentIntents/Checkout Sessions or receive webhooks yet.

## Key Commands

Run from the repo root (`/docker/projects/TallinnCruises`):

- `pnpm install` — install all workspace dependencies
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/tallinn-shore-tours run dev` — run the website dev server (listens on `0.0.0.0:5173`)
- `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/tallinn-shore-tours run build` — production build to `artifacts/tallinn-shore-tours/dist/public`
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Deployment (production)

Live at **https://privatetourstallinn.com** (Let's Encrypt via Caddy).

- Reverse proxy: Caddy (`/docker/infrastructure/traefik/Caddyfile`, docker
  network `proxy`):
  - `privatetourstallinn.com → viabaltica-app:5000`
  - `www.privatetourstallinn.com` → 301 to the apex domain
  - `viabaltica.network.today` (previous domain) → 301 to the new domain
  - Caddy has `admin off`, so config changes need `docker restart caddy`
    (`caddy reload` over the admin API is unavailable).
- Container/compose names still use the `viabaltica` prefix (historical, from
  the original deployment scaffold) — only the public domain changed.
- Stack (this repo's `docker-compose.yml`, compose project `viabaltica`):
  - `viabaltica-app` — nginx:alpine serving the pre-built site on port 5000
    (`Dockerfile` + `deploy/nginx.conf`)
  - `viabaltica-db` — postgres:17-alpine on the `internal` network, volume
    `viabaltica-db-data` (for the future api-server; the static site does not
    use it)
- Deploy/update: `deploy/deploy.sh` (host Vite build + `docker compose up -d --build`).
- Compose reads `POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB` from `.env` —
  never run `docker compose up` on the `db` service before those are set.
- `/docker/projects/viabaltica` is the original deployment scaffold, now
  superseded by this repo (see its README).
- The old Replit deployment (`.replit` → autoscale) no longer applies.
