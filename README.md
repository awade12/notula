# notesapp

Monorepo: TanStack Start web app + Hono/Hocuspocus server + shared packages.

## Requirements

- Node.js 20+
- [Bun](https://bun.sh) or [pnpm](https://pnpm.io)
- Docker Desktop (only if `DATABASE_URL` points at `localhost` — see `apps/server/.env.example`)

## First time

```bash
bun install    # or: pnpm install
bun run setup  # or: pnpm run setup
```

`setup` copies `.env` files from examples, starts local Postgres when needed, and runs migrations.

## Development

```bash
bun run dev    # or: pnpm run dev
```

- Web: http://localhost:3000
- API + collab: http://localhost:3001

## Useful commands

| Command | Description |
| --- | --- |
| `bun run dev` | Web + server (with env + migrate prep) |
| `bun run setup` | Install deps, env files, Docker Postgres, migrate |
| `bun run db:up` | Start Docker Postgres only |
| `bun run db:migrate` | Apply Drizzle migrations |
| `bun run build` | Build shared → server → web |
| `bun run typecheck` | Typecheck all packages |

Use a cloud Postgres (e.g. Neon) by setting `DATABASE_URL` in the root `.env` — Docker is skipped automatically.

All environment variables (server + web) live in **`.env` at the repo root**. See `.env.example`. Legacy `apps/server/.env` still overrides root values if present.
