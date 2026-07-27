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

`artifacts/tallinn-shore-tours/vite.config.ts` refuses to start without:

- `PORT` — dev/preview server port (e.g. `5173`)
- `BASE_PATH` — base public path (use `/` for root)

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

## Deployment notes

- The old Replit deployment (`.replit` → autoscale) no longer applies.
- On this server the intended path is a production Vite build served behind
  Traefik (Docker), consistent with the other projects under `/docker/projects`.
