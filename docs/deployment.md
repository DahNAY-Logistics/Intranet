# Deployment

The app ships as **one container**. Express serves the API *and* the built React client from a
single origin, which is why `client/src/lib/api.ts` can keep its relative `baseURL: '/api'` and
the Better Auth browser client can keep deriving its origin from `window.location`. Nothing
needs CORS, `SameSite=None` cookies, or a `VITE_API_URL`.

The primary target is a **plain VM** (an Azure VM or otherwise) running Docker Compose, with
**PostgreSQL as a second container** (`postgres:17-alpine`) on a named volume, rather than Azure
Database for PostgreSQL — see "PostgreSQL via Docker Compose" below for setup. An **Azure Storage**
account is still used for attachments, per [tech-stack.md](./tech-stack.md). The app image itself is
host-agnostic — it also runs unchanged on Azure App Service for Containers or Container Apps against
an external Postgres if that changes later; see "Running on a VM instead of App Service" for what a
VM has to provide that App Service otherwise handles for you (TLS, restarts, health probing).

## How the image is put together

| Stage | What it does |
| --- | --- |
| `base` | `node:24-bookworm-slim` plus `openssl`, which the slim variant omits and Prisma probes for to pick an engine. |
| `install` | `npm ci` in `core/`, `client/`, `server/` separately — this repo is not an npm workspace. |
| `build` | `prisma generate`, then `tsc -b && vite build` for the client. |
| `production` | Copies `core/` + `server/` source, their `node_modules`, `server/src/generated` and `client/dist`, and runs as the non-root `node` user. |

**Debian (`bookworm-slim`), not Alpine** — a deliberate switch from an earlier Alpine base. Alpine's
draw was fewer CVEs and a smaller image, but it runs musl instead of glibc, and Prisma's Alpine
engines have historically lagged the glibc ones for compatibility edge cases; Debian's `node:slim`
is Prisma's own documented fallback "when encountering compatibility issues with Alpine." Both
still need `openssl` installed by hand — Alpine omits it, and `bookworm-slim` dropped it too as of
Debian 12 ([prisma/prisma#19729](https://github.com/prisma/prisma/issues/19729)) — just via
`apt-get` instead of `apk`, per
[Prisma's Docker deployment guide](https://www.prisma.io/docs/guides/deployment/docker).
This does widen the image's CVE surface somewhat (Debian slim ships more base packages than Alpine),
so it's a compatibility-over-minimalism trade, not a free upgrade — re-run `docker scout`/whatever
scanner you use after this change. `prisma generate` also needs `DATABASE_URL` set at build time (a
placeholder is enough; `prisma.config.ts` resolves `env('DATABASE_URL')` and generate never opens a
connection) — the `build` stage declares it as `ARG DATABASE_URL="postgresql://placeholder:..."`
rather than baking it in with `ENV`, so `docker build --build-arg DATABASE_URL=...` can override the
default without editing the Dockerfile. Docker exposes an `ARG`'s value as a shell environment
variable to every following instruction in that stage automatically, so `prisma generate` sees it
with no extra `ENV` line.

`.dockerignore` excludes `**/.env` and `**/.env.*`, not just `.env` — patterns are relative to the
build context root, so without the `**` prefix `server/.env` is copied straight into the image by
`COPY server ./server`, secrets and all.

The server runs its TypeScript directly through `tsx` (`npm start`), so **the source is the
artifact** — there is no emitted `dist/`. That is why `tsx` and the `prisma` CLI are runtime
dependencies in `server/package.json` rather than dev dependencies.

The container command is `prisma migrate deploy && npm start`, so every start applies pending
migrations before serving. Three migrations create raw Postgres functions
(`get_reporting_descendants`, `get_dashboard_stats`, `get_mood_trend`), so `prisma db push` is
**not** a substitute for `migrate deploy`.

## Verify locally before deploying

Copy `server/.env.example` to `server/.env` and fill it in, including `POSTGRES_PASSWORD` — this one
file covers both the app's own config and compose's `${...}` interpolation (see "PostgreSQL via
Docker Compose" below). Set `CLIENT_URL`/`BETTER_AUTH_URL` to `http://localhost:3000` and point
`BLOB_STORAGE_CONNECTION_STRING` at Azurite via `host.docker.internal`
(`UseDevelopmentStorage=true` will not find a host Azurite from inside a container; spell out
`BlobEndpoint=http://host.docker.internal:10000/devstoreaccount1`). `DATABASE_URL` in `server/.env`
is ignored for this run — compose injects its own, pointing at the `postgres` service.

```bash
make docker-up
# equivalent to: docker compose --env-file server/.env up -d --build
```

Then check:

```bash
curl localhost:3000/api/health          # {"status":"ok"}
curl -i localhost:3000/admin/settings   # 200 text/html - SPA fallback, not a 404
curl -i localhost:3000/api/nope         # 404 application/json
```

`make docker-down` stops the stack and **keeps** the `postgres_data` volume, so data survives
between runs; `docker compose --env-file server/.env down -v` additionally deletes it if you want a
clean slate. Every `docker compose` subcommand needs `--env-file server/.env` (or `make`'s wrapper
target) — compose re-interpolates the file on every invocation, and `POSTGRES_PASSWORD` has no
default, so a bare `docker compose ...` fails with "required variable ... is missing a value".

If you need to run the app image against a Postgres you manage yourself instead (no compose), the
plain `docker run` form still works — set `DATABASE_URL` to wherever that Postgres actually is:

```bash
docker run --rm -p 3000:3000 --env-file server/.env \
  -e NODE_ENV=production \
  -e DATABASE_URL='postgresql://USER:PASS@host.docker.internal:5432/intranet?schema=public' \
  -e CLIENT_URL=http://localhost:3000 \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  intranet:local
```

`host.docker.internal` is how the container reaches services on your machine — `localhost` inside
the container is the container itself. Check it the same way as above.

Either way, this is the only way to exercise `NODE_ENV=production` — `trust proxy`, all three rate limiters,
and the SPA fallback are inactive in dev. Zoho SSO still cannot complete locally, because the
redirect URI is registered against `localhost:5173`.

## PostgreSQL via Docker Compose

`docker-compose.yml` runs Postgres as a second service (`postgres:17-alpine` — Alpine is fine here
since the Prisma-engine/musl compatibility concern that moved the *app* image to Debian doesn't
apply to a Postgres server) alongside `app`, both on compose's own bridge network — the
app reaches it at the hostname `postgres`, resolved by Docker's embedded DNS, not an IP address you
have to track down.

**Volume**: `postgres_data` is a named volume (`driver: local`), not a bind mount. A named volume is
the efficient choice for database storage — it's managed entirely inside Docker's storage area, so
on Linux it's a normal directory on the host filesystem with no translation layer, and it avoids the
sustained I/O penalty a bind mount takes on Docker Desktop (Mac/Windows), where every read/write
round-trips through the host-VM file-sharing layer (gRPC-FUSE/VirtioFS) instead of hitting disk
directly — the difference is significant for a database doing constant small writes (WAL fsyncs).
`PGDATA` is set to a subdirectory of the mount (`/var/lib/postgresql/data/pgdata`) rather than the
mount root itself, which is the image's own documented way to avoid Postgres refusing to initialize
against a non-empty mount point (some volume/storage drivers leave metadata at the root).

1. **Fill in `server/.env`** (copy from `server/.env.example` if you haven't already) — set
   `POSTGRES_PASSWORD`; `POSTGRES_USER`/`POSTGRES_DB` default to `intranet` if left unset. This is
   the **only** env file compose needs; there is deliberately no separate root `.env`.
2. **Start the stack**: `make docker-up` (`docker compose --env-file server/.env up -d --build` —
   the `--env-file` flag is what points compose's own `${...}` interpolation at `server/.env`
   instead of the root-`.env` default it would otherwise look for). `app` waits for `postgres`'s
   healthcheck (`pg_isready`) before starting, so `prisma migrate deploy` never races an unready
   database.
3. **`server/.env`'s `DATABASE_URL` line is not used when running via compose** — `docker-compose.yml`
   sets `DATABASE_URL` directly on the `app` service from the `POSTGRES_*` values in that same file,
   pointing at `postgres:5432`. The line in `server/.env` only matters for the plain `docker run`
   form (external Postgres) or for running the server outside Docker entirely (`npm run dev` in
   `server/`), where you'd point it at `localhost:5432` since the compose port mapping below exposes
   it there too.
4. **Port mapping**: `postgres` publishes to `127.0.0.1:5432` only, not `0.0.0.0` — reachable from
   the host machine (e.g. `psql`, `db:studio`) but not from outside the VM. Keep it that way; don't
   drop the `127.0.0.1:` prefix in the port mapping. The host-side port is `POSTGRES_HOST_PORT`
   (defaults to `5432`) — override it in `server/.env` if the host already has something bound to
   5432 (e.g. a locally installed Postgres); the container's own port and `DATABASE_URL` (which
   addresses it via the compose network as `postgres:5432`) are unaffected either way.
5. **Backups are still your responsibility.** A named volume is not automatically backed up. Run
   `docker compose --env-file server/.env exec postgres pg_dump -U intranet intranet > backup.sql`
   on a schedule (cron), or
   snapshot the VM disk if that's already part of your ops story. Losing the volume without a backup
   loses the database — there is no separate managed-Postgres safety net here.

If deploying to **App Service for Containers** instead of a VM, point it at your image, set the
health check path to `/api/health`, turn on **HTTPS Only**, and use Azure Database for PostgreSQL
Flexible Server instead of the `postgres` compose service (its connection string does need
`?sslmode=require`); App Service for Containers doesn't run docker-compose, so `postgres` wouldn't
travel with it anyway.

## Storage account

Azure Storage account plus a blob container (default name `attachments`). **Enable
`allowBlobPublicAccess`.** `server/src/lib/attachments/blob-storage.ts` calls
`createIfNotExists({ access: 'blob' })` and `setAccessPolicy('blob')`; new Azure storage accounts
block anonymous blob access by default, so the first upload throws. Blob URLs are stored raw in the
`attachment` table and served straight to the browser. The alternative — a private container plus
SAS generation — is a code change, not a configuration change.

## Application settings

Every variable is read straight off `process.env` and validated at import time, so a missing
required value is a boot crash naming the variable, not a silent misbehaviour.

| Setting | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Set by `docker-compose.yml` itself when running via compose (points at the `postgres` service) — don't set it in `server/.env` in that case. Only needed there for the plain-image `docker run` form against an externally-managed Postgres, e.g. `postgresql://intranet:...@172.17.0.1:5432/intranet?schema=public`. No `sslmode=require` needed for a same-VM/same-compose-network connection. |
| `BETTER_AUTH_SECRET` | yes | Min 32 chars. `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | yes | The **public site origin**, e.g. `https://intranet.example.com`. |
| `CLIENT_URL` | yes | Same value as `BETTER_AUTH_URL` — it is one origin now. |
| `ZOHO_ACCOUNTS_URL` | yes | Data-centre specific (`accounts.zoho.in` / `.com` / `.eu`). |
| `ZOHO_CLIENT_ID` | yes | |
| `ZOHO_CLIENT_SECRET` | yes | |
| `ZOHO_CALENDAR_API_URL` | yes | Same data centre as `ZOHO_ACCOUNTS_URL`. |
| `ALLOWED_EMAIL_DOMAIN` | yes | The only domain permitted to sign in. |
| `BLOB_STORAGE_CONNECTION_STRING` | yes | Real storage account connection string. |
| `BLOB_STORAGE_CONTAINER_NAME` | yes | e.g. `attachments`. |
| `WEBSITES_PORT` | App Service | `3000`, matching the image's `EXPOSE`. |
| `PORT` | no | Defaults to `3000`; App Service injects it. |
| `NODE_ENV` | no | Already `production` in the image. Do not override. |
| `SENTRY_DSN` | no | Blank disables the server SDK entirely. |
| `SENTRY_ENVIRONMENT` | no | Falls back to `NODE_ENV`. |
| `GHOST_API_URL` | no | Blank means `/api/blogs` answers `503`. |
| `GHOST_CONTENT_API_KEY` | no | Needed together with `GHOST_API_URL`. |
| `SEED_ADMIN_EMAIL` | seed only | See bootstrap below. |
| `SEED_ADMIN_NAME` | seed only | See bootstrap below. |

`VITE_SENTRY_DSN` is **not** an application setting. Vite inlines `import.meta.env.VITE_*` into the
bundle at build time, so setting it on App Service does nothing. The `build` stage declares
`ARG VITE_SENTRY_DSN=""`, defaulting to disabled (`src/lib/sentry.ts`'s browser side degrades the
same way the server side does — see `enabled: Boolean(SENTRY_DSN)` above) — pass the real DSN at
build time instead of pinning it in the Dockerfile:

```bash
docker build --build-arg VITE_SENTRY_DSN=https://...ingest.sentry.io/... -t intranet .
# or: make docker-build-prod, which reads it from client/.env's VITE_SENTRY_DSN automatically
```

A browser DSN is public by design (it ships inside the JS every visitor downloads), so there's no
secrecy requirement here — the `ARG` is just to keep a rotation out of git history and out of
`make docker-build`'s default (unmonitored) build.

## Zoho redirect URI

Register the production callback with Zoho before the first sign-in:

```
${BETTER_AUTH_URL}/api/auth/oauth2/callback/zoho
```

`LandingPage.tsx` uses relative callback paths that resolve against `BETTER_AUTH_URL`
server-side, so a wrong value sends users to the wrong host after SSO.

## Bootstrap the first admin

Sign-up is disabled and the `user` table is an **allowlist** — `databaseHooks.user.create.before`
always throws. **Nobody can sign in until this runs.** SSH into the VM, exec into the running `app`
container via compose (this resolves the container regardless of its generated name, unlike
`docker exec <name>`), and:

```bash
docker compose --env-file server/.env exec app sh
cd server && SEED_ADMIN_EMAIL=you@yourdomain SEED_ADMIN_NAME="Your Name" npm run db:seed
```

The address must sit inside `ALLOWED_EMAIL_DOMAIN`. It creates rather than upserts, so it will
not clobber a display name Zoho has already written. Add everyone else as `user` rows
(`npm run db:studio`, or by hand) — the auth flow never creates them.

## Rate limiting behind the load balancer

`app.set('trust proxy', 1)` is enabled under `NODE_ENV=production` so `express-rate-limit` keys
on the real client IP rather than the load balancer's. Three tiers, all production-only:

| Limiter | Budget | Applies to |
| --- | --- | --- |
| `authRateLimit` | 10 / 15 min | `/api/auth/sign-in`, `/api/auth/oauth2` |
| `sessionRateLimit` | 300 / 15 min | the rest of `/api/auth` |
| `apiRateLimit` | 100 / 15 min | `/api` |

Better Auth's own built-in limiter is **disabled** (`rateLimit: { enabled: false }` in `auth.ts`).
It resolves the client IP from headers itself, and since 1.6.21 it refuses to trust multi-hop
`X-Forwarded-For` chains — which is exactly what App Service sends (a comma-separated list of
`ip:port`). Left enabled it falls back to a single shared bucket for every user, so one busy
period would `429` everybody. Express's limiter, which does resolve the IP correctly via
`trust proxy`, owns `/api/auth` instead.

## Running on a VM instead of App Service

The image is host-agnostic (see "How the image is put together" above), so it runs the same way
on a plain Azure VM (or any VM) with Docker installed. The differences from App Service are what
App Service normally does for you: TLS termination, the health-check probe, and restarting the
container after a crash or reboot.

1. **Install Docker Engine** on the VM (`curl -fsSL https://get.docker.com | sh` on
   Debian/Ubuntu) — the get.docker.com script installs the `docker compose` plugin (v2) alongside
   it, so no separate install step for compose.
2. **Put the production env file on the VM, not in the repo.** One file, `server/.env`, covers
   everything `docker-compose.yml` needs — both the `POSTGRES_*` values (its own `${...}`
   interpolation) and everything else the app reads (Application settings table below). Copy
   `server/.env.example` to a path outside any git working tree, e.g. `/etc/intranet/server.env`,
   fill in the real values, and lock it down: `chmod 600 /etc/intranet/server.env`. `DATABASE_URL`
   in this file is ignored under compose (see "PostgreSQL via Docker Compose" above); leave it blank
   or unset. `.dockerignore` already excludes every `.env*` from the build context, so this file is
   never baked into the image — it's supplied to `docker compose` at run time.
3. **Bring the stack up**, pointing compose at that env file and the repo checkout (for
   `docker-compose.yml` and the build context) — a reverse proxy in front handles the public port
   and TLS, so the app itself should not be reachable directly, which is why `docker-compose.yml`
   already binds `app` to `127.0.0.1:3000`:

   ```bash
   cd /opt/intranet   # the repo checkout providing docker-compose.yml + build context
   docker compose --env-file /etc/intranet/server.env up -d --build
   ```

   `--env-file` here does double duty: it's both compose's interpolation source (`POSTGRES_*`) and,
   via `docker-compose.yml`'s `env_file: server/.env`, the app container's own runtime environment —
   symlink it into the checkout too so that half resolves (`ln -s /etc/intranet/server.env
   server/.env`; `env_file:` is a relative path resolved from `docker-compose.yml`'s location, a
   separate lookup from the `--env-file` flag). `restart: unless-stopped` on both services covers a
   crashed process and a VM reboot — Docker's own daemon already starts on boot via systemd on most
   distros, so a separate systemd unit isn't needed unless you want one for other reasons (log
   capture, dependency ordering).
4. **Put a reverse proxy in front for TLS** — App Service's "HTTPS Only" has no VM equivalent.
   Nginx with certbot or Caddy (automatic HTTPS) both work; the proxy must forward
   `X-Forwarded-For` and `X-Forwarded-Proto`, since `app.set('trust proxy', 1)` (active under
   `NODE_ENV=production`) trusts exactly one hop and `express-rate-limit` keys on whatever IP that
   resolves to. Example Nginx server block:

   ```nginx
   server {
     listen 443 ssl;
     server_name intranet.example.com;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

5. **Firewall**: open 80/443 publicly; keep 3000 and 5432 reachable only from the VM itself —
   `docker-compose.yml` already binds both to `127.0.0.1`, so the OS firewall is a second layer,
   not the only one (see "PostgreSQL via Docker Compose" above).
6. **Health checks**: the Dockerfile has no `HEALTHCHECK` instruction, so `docker ps` won't show a
   health status for the container on its own — there's no platform probe to do this for you outside
   App Service either, so point an uptime check or monitoring agent on the VM at `/api/health`
   directly instead.
7. **Bootstrap the first admin and register the Zoho redirect URI** exactly as described below —
   neither step differs between App Service and a VM.

## Known follow-ups

- **`apiRateLimit` is 100 requests / 15 min per IP across all of `/api`.** A page firing six or
  seven queries gives roughly a dozen page loads per quarter hour. It has never run under real
  load. Watch for `429`s after go-live and raise it in `server/src/middleware/rate-limit.ts` if
  normal usage trips it.
- `tracesSampleRate` is `1` on both the server and browser SDKs — 100% of transactions. Worth
  lowering once traffic is real.
- No source maps are uploaded to Sentry (`@sentry/vite-plugin` is not installed), so browser
  stack traces are minified.
- **`helmet()` runs with its default Content Security Policy, which has never applied to a page
  before.** In dev the browser loads the document from Vite on `:5173`, so helmet's headers only
  ever reached API responses. Now that Express serves `index.html`, the defaults apply — and
  `img-src 'self' data:` blocks banner and attachment images served from
  `*.blob.core.windows.net` as well as Ghost images, `connect-src 'self'` blocks the browser
  Sentry SDK, and there is no `worker-src` for Sentry Replay's compression worker. Open the
  browser console against the container before go-live; if violations appear, widen the
  directives via `helmet({ contentSecurityPolicy: { directives: { ... } } })` in
  `server/src/index.ts`. Note that helmet merges with its defaults (`useDefaults`), so a default
  directive can only be removed by setting it to `null`.
- The timer-triggered Azure Function that expires announcements and events
  ([tech-stack.md](./tech-stack.md)) is not built yet.

## Choosing a delivery method

Nothing in this repo pushes the image anywhere yet — that decision is still open. Two
straightforward options:

- **GitHub Actions → Azure Container Registry → App Service.** A workflow builds the image,
  pushes it to ACR, and updates the web app. Use OIDC federated credentials so no long-lived
  secret lives in GitHub. Take this if deploys should follow merges to `main`.
- **By hand.** `az acr build --registry <acr> --image intranet:<tag> .`, then point the web app
  at the new tag. Fine while the deploy cadence is low.

Either way the image, its build arguments, and the settings above do not change.
