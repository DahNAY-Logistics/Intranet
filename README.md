# Intranet

Internal web application for organization-wide communication: announcements, events, resources,
quick links, upcoming employee birthdays, and a daily mood check-in.

Authentication is domain-restricted Zoho SSO. Sign-up is disabled and the `user` table is an
allowlist — people are provisioned, never self-registered.

## Layout

This is **not** an npm workspace. Each directory installs independently.

| Directory | What it is |
| --- | --- |
| `client/` | React 19 + Vite SPA |
| `server/` | Express 5 API, Prisma, Better Auth |
| `core/` | Shared TypeScript source (messages, constants, contracts, zod schemas), compiled by both sides |
| `e2e/` | Playwright suite, run against a throwaway database |

## Getting started

Requires Node 24+, Docker, and a local PostgreSQL.

```bash
make install                       # installs every package and sets up the database
cp server/.env.example server/.env # then fill it in
```

Environment guards run at import time, so the server refuses to boot until `DATABASE_URL`,
`CLIENT_URL`, `ALLOWED_EMAIL_DOMAIN`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`,
`ZOHO_ACCOUNTS_URL`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_CALENDAR_API_URL` and the two
`BLOB_STORAGE_*` variables are set.

Run both sides — the browser only talks to Vite on `:5173`, which proxies `/api` to Express:

```bash
cd client && npm run dev     # :5173
cd server && npm run dev     # :3000
make azurite                 # Blob Storage emulator, needed for uploads
```

`make help` lists every task.

## Checks

```bash
make check       # lint + typecheck + component tests
make test-e2e    # Playwright, needs Postgres and Azurite
```

## Docker

The production image is the whole app: Express serves the API and the built client from one
origin, and applies pending migrations on start.

```bash
make docker-build            # build intranet:local

docker run --rm -p 3000:3000 --env-file server/.env \
  -e NODE_ENV=production \
  -e DATABASE_URL='postgresql://USER:PASS@host.docker.internal:5432/intranet?schema=public' \
  -e CLIENT_URL=http://localhost:3000 \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  intranet:local
```

Note that `VITE_SENTRY_DSN` is inlined by Vite at build time, so it is set in the Dockerfile rather
than as a runtime setting.

## Deploying

See [docs/deployment.md](./docs/deployment.md) for the Azure resources, the full application
settings table, the Zoho redirect URI, and the one-time admin bootstrap.

## Documentation

- [docs/project-scope.md](./docs/project-scope.md) — features, roles, auth model
- [docs/tech-stack.md](./docs/tech-stack.md) — stack and cloud services
- [docs/implementation-plan.md](./docs/implementation-plan.md) — phased build order
- [docs/deployment.md](./docs/deployment.md) — building and shipping the container
