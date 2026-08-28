# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Documentation lookups

Use **Context7 MCP** (`resolve-library-id` then `query-docs`) before writing code against any
library/framework/SDK/API/CLI/cloud service used here — React, Vite, Express, TypeScript, Prisma,
Azure SDKs, Zoho SSO, etc. The stack is pinned to very recent majors (React 19, react-router 8,
Express 5, Vite 8, TypeScript 6, TanStack Query 5, Zustand 5, oxlint 1.x), so training data likely
describes the previous major — use Context7 even when you think you know the answer. Resolve the ID
first, then one concept per `query-docs` call; split multi-topic questions. Skip for refactoring,
business-logic debugging, code review, and general programming questions.

## Project

Internal org intranet: announcements, events, resources, quick links, birthdays, and an
anonymous daily mood check-in. Roles `User`/`Admin` (Admin = CRUD over every entity). Auth is
domain-restricted Zoho SSO.

See [docs/project-scope.md](./docs/project-scope.md) (features), [docs/tech-stack.md](./docs/tech-stack.md)
(stack), [docs/implementation-plan.md](./docs/implementation-plan.md) (phased build order — source of
truth for what's next). Phases 0–1 done (Zoho SSO, roles, login UI, client route protection). Phase 2
(domain models + admin CRUD) is next. Not started: Azure App Service, Azure DB for PostgreSQL, Azure
Blob Storage, and a timer-trigger Azure Function for auto-expiring announcements/events.

## Current state

Authenticated shell around a health-check vertical slice: `GET /api/health`, `ApiStatus.tsx`
(queries it, renders in nav bar), Better Auth at `/api/auth/*` against local Postgres `intranet`. No
domain models yet. Playwright wired in `e2e/` against `intranet_test`, but no tests written.

`ApiStatus` shows only when session is admin *and* path is `/admin` (`NavBar.tsx`) — it's an operator
diagnostic, not staff-facing; don't promote it to `HomePage` (just a greeting off `useSession()`).

Client data layer (already what Phase 2 builds on): axios (`src/lib/api.ts`) under TanStack Query
(`src/lib/query-client.ts`) for API data, Zustand (`src/stores/`) for everything else, `core/` for
messages/constants/contracts. Details under Architecture.

`prisma/schema.prisma` has the Better Auth models (`User`/`Session`/`Account`/`Verification`) and a
`Role` enum; one migration (`add_better_auth_models`). Domain models are Phase 2.

**Auth is closed by default** (`src/lib/auth/auth.ts`, `genericOAuth` plugin against Zoho's OIDC
discovery doc):

- `disableSignUp: true` + `databaseHooks.user.create.before` always throws `FORBIDDEN`. `user` table
  is an **allowlist** (rows come from `prisma/seed.ts` or by hand, never the auth flow). First
  sign-in *links* onto an existing row — `account.accountLinking.trustedProviders` must include
  `'zoho'` or you get `account_not_linked`.
- `databaseHooks.session.create.before` re-checks `ALLOWED_EMAIL_DOMAIN` on every sign-in, not just
  the first.
- Both rejections return the same vague message on purpose (an outsider can't distinguish
  "unprovisioned" from "wrong domain" and enumerate staff) — preserve this if you touch the hooks.
  `LoginPage.tsx` mirrors it client-side: one fixed access-denied message for any `?error=`.

**Env vars: read straight off `process.env`, no schema.** `src/index.ts` and `prisma/seed.ts` each
start with `import 'dotenv/config';` as the **first** import (ESM evaluates deps in source order;
`db.ts`/`auth.ts` read vars at import time, so late dotenv = empty env). `prisma.config.ts` does the
same for the CLI. Any new entry point needs that line first.

Each module validates what it needs at import time, throwing an `envMessages` entry
(`core/messages.ts`):

- `src/db.ts` — `DATABASE_URL` → `MISSING_DATABASE_URL`.
- `src/lib/auth/auth.ts` — `CLIENT_URL` → `MISSING_CLIENT_URL`; `BETTER_AUTH_URL`+`BETTER_AUTH_SECRET` →
  `MISSING_BETTER_AUTH_ENV`; `ZOHO_ACCOUNTS_URL`+`ZOHO_CLIENT_ID`+`ZOHO_CLIENT_SECRET` →
  `MISSING_ZOHO_ENV`. The Better Auth pair is passed into `betterAuth()` as `baseURL`/`secret`.
- `src/lib/auth/email-domain.ts` — `ALLOWED_EMAIL_DOMAIN` → `MISSING_ALLOWED_EMAIL_DOMAIN`; lowercased
  once at module scope. Without the guard, a missing var compares against `undefined` and silently
  rejects every sign-in while the server boots clean.
- `prisma/seed.ts` — `SEED_ADMIN_EMAIL`+`SEED_ADMIN_NAME` → `MISSING_SEED_ENV_VARIABLES` (kept out of
  the API's own checks so it never refuses to boot over seed-only vars).

**Group checks by dependency, not by variable** — one `if`/one `Missing one or more …` message per
related set (`MISSING_ZOHO_ENV`, `MISSING_BETTER_AUTH_ENV`); a standalone var gets its own `X is not
defined…` message. Don't add a message per variable.

**`betterAuth()` gets `baseURL`/`secret` explicitly — that's the point of guarding them.** Left to
its own env lookup, a missing `BETTER_AUTH_URL` only warns and derives origin per-request (breaks
OAuth callbacks later); a missing `BETTER_AUTH_SECRET` falls back to a hardcoded `DEFAULT_SECRET`
that only throws under `NODE_ENV=production` — so dev sessions would get silently signed with a
public key. Reading both ourselves converts that into a boot failure. Don't drop the options back out
"because the env var is enough." Follow this pattern for any new var: read, guard, throw an
`envMessages` entry, pass explicitly into the library. Open trade-offs vs. the old Zod schema:
nothing is scheme-checked, and failures surface one at a time.

`PORT` (`Number(process.env.PORT) || 3000`) and `NODE_ENV` are the only unguarded vars. Everything
else is guarded — add a guard when you add a variable.

`NODE_ENV` gates: `trust proxy` in `src/index.ts` (for Azure App Service TLS termination) and
`src/middleware/rate-limit.ts` (both compare against `environment.production` from
`core/constants.ts`, never a bare literal). Below `production` both limiters pass through — a new
limit is untested until something runs with `NODE_ENV=production`. `authRateLimit` (10/15min) on
`/api/auth`, `apiRateLimit` (100) on `/api` — ordering matters, see Architecture.

`src/db.ts` builds `PrismaClient` on `@prisma/adapter-pg`, so the connection URL comes from
`process.env.DATABASE_URL` directly, not the schema's `datasource` block — `prisma.config.ts` passes
`datasource.url` explicitly for the CLI for the same reason.

`src/middleware/require-auth.ts`/`require-admin.ts` export `requireAuth`/`requireAdmin`
(`requireAdmin` delegates then checks `Role.Admin`). Written for Phase 2, not yet applied to any
route. `requireAuth` sets `req.auth`, typed via `Express.Request` augmentation in
`src/types/express.d.ts`.

Client: `src/lib/auth-client.ts` builds `better-auth/react` with `genericOAuthClient()` +
`inferAdditionalFields` for `role` (needed for `session.user.role` typing). `main.tsx` wraps `App` in
`QueryClientProvider` → `BrowserRouter` (react-router v8, from `react-router` not `react-router-dom`).
`ProtectedRoute` renders `AppLayout` when a session exists, redirects to `/login` otherwise, and shows
a loading line while `isPending` — keep that third branch or first paint bounces authenticated users.
`AdminRoute` nests inside, repeats the pattern against `session.user.role`, redirects non-admins to
`/` — client-side convenience only; `requireAdmin` on the server is the real check.

`@better-auth/cli` is **not** a dependency (pins an old `better-auth`/`drizzle-orm` with 8
advisories). Schema is hand-maintained; to regenerate, run
`npx @better-auth/cli@latest generate --config src/lib/auth/auth.ts` in a throwaway shell and diff.

Not an npm-workspaces monorepo. Root `package.json` is tooling-only (Husky + commitlint, no
`workspaces`). `client/`, `server/`, `e2e/` each install independently. `core/` is shared TS source
with no `package.json` — see Architecture.

`server/package.json` says `"main": "dist/index.js"` but `tsconfig.json` is `noEmit`, so `dist/` is
never written — wire up a real build or drop the field before relying on it.

`zod` is back as a server dependency (was removed with the env schema; reinstalled for request
validation — see `server/src/lib/validate.ts` under Conventions). It's a `server/`-only dependency,
never `core/` — `core/` still has no `package.json`/dependencies (see Architecture), so schemas live
under `server/src/schemas/`, not alongside the shared `core/types.ts` contracts.

**Settings is the first singleton-record feature** (site name, organization name, support email,
Code of Conduct/Privacy Policy URLs, maintenance-mode toggle) — `server/prisma/schema.prisma`'s
`Settings` model, always operated on via a hardcoded `id: 1` (no seed row: `PUT` does
`prisma.settings.upsert({ where: { id: 1 }, ... })` so the first admin save creates it, and `GET`
falls back to a safe all-defaults object — `maintenanceMode: false` — when the row doesn't exist yet,
so a fresh DB never locks anyone out or breaks the header). `GET /api/settings`
(`server/src/routes/settings.ts`) is `requireAuth`-only, not `requireAdmin`, because every signed-in
role needs it (header site name, footer, the maintenance check below); `PUT` is admin-only.
`core/schemas/settings.ts` validates `codeOfConductUrl`/`privacyPolicyUrl` as nullable URLs (admin
pastes an external link — no local markdown pages for these). `client/src/hooks/use-settings.ts`
(`useSettings()`) is the one shared TanStack Query hook every consumer (`NavBar`, `AppSidebar`,
`Footer`, `MaintenanceGate`, `SettingsForm`) reads from — a deliberate exception to "inline `useQuery`
per feature" because this is the same singleton read from five unrelated places, not one feature's own
composition.

**Maintenance mode gates *after* authentication, never before.** `MaintenanceGate.tsx` sits inside
`ProtectedRoute` and wraps both the `AppLayout` branch and the `AdminRoute` branch in `App.tsx` — login
always works (we need the session to know the role); a signed-in Admin bypasses unconditionally; a
signed-in non-admin sees `MaintenancePage` instead of `<Outlet/>` once `settings.maintenanceMode` is
confirmed `true`. It fails *open* (renders `<Outlet/>`) while the settings query is pending or errored
— a slow/flaky fetch must never lock real users out — and polls every 30s
(`useSettings({ refetchInterval: 30_000 })`) so an already-open tab notices a live toggle without a
hard refresh.

**`Footer.tsx` renders only from `AppLayout.tsx`, never `AdminLayout.tsx`** — organization name,
support email (`mailto:`), and the two optional policy links, each independently hidden when its URL
is unset. `AppLayout` is a `min-h-screen` flex column with `main` as `flex-1` specifically so the
footer pins to the viewport bottom on short pages (e.g. today's bare-greeting `HomePage`) instead of
trailing right after the content — don't revert to a bare fragment there.

## Commands

Run from the respective directory; `npm install` is per-directory.

**repo root** (tooling only): `npm install` sets up Husky + commitlint hooks — run once after
cloning or the `commit-msg` hook won't catch bad messages.

**client/**

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server on :5173, proxies `/api` to :3000 |
| `npm run build` | `tsc -b` then `vite build` |
| `npx tsc -b` | Typecheck only |
| `npx oxlint` | Lint |
| `npm test` | Vitest component tests (single run, not watch mode) |

**server/**

| Command | Description |
| --- | --- |
| `npm run dev` | `tsx watch src/index.ts` |
| `npx tsc --noEmit` | Typecheck |
| `npm run db:generate` | `prisma generate` → `src/generated/prisma` (gitignored) |
| `npm run db:migrate` | `prisma migrate dev` (does **not** seed) |
| `npm run db:seed` | `tsx prisma/seed.ts` — provisions `SEED_ADMIN_EMAIL` admin |
| `npm run db:studio` | `prisma studio` |

Both sides must run for the client to reach the API. Copy `server/.env.example` → `server/.env` and
fill it in — guards run at import time, so the server throws at boot without `DATABASE_URL`,
`CLIENT_URL`, `ALLOWED_EMAIL_DOMAIN`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `ZOHO_ACCOUNTS_URL`,
`ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`. `PORT`/`NODE_ENV` are optional, as are
`GHOST_API_URL`/`GHOST_CONTENT_API_KEY` — see the degrade-don't-throw exception below.

**Observability: Sentry only — there is no logging library.** `src/lib/sentry.ts` holds the whole
setup: it calls `Sentry.init` and default-exports the SDK, following
[mosh-hamedani/helpdesk](https://github.com/mosh-hamedani/helpdesk)'s `server/src/lib/sentry.ts`.
Everything that needs Sentry imports *that* module (`index.ts`, `middleware/request-metrics.ts`),
never `@sentry/node` directly, so there is one initialization point and no way to get a
half-configured SDK.

**`import Sentry from './lib/sentry.ts';` must stay the first import in `index.ts`.** It is what
carries `import 'dotenv/config';`, so moving it down into the local-import group makes `auth.ts` and
`db.ts` evaluate before dotenv runs and the server throws at boot on "missing" env vars. This
replaces the older dotenv-first rule for this entry point — the rule is unchanged, it just lives one
level down now.

- **It degrades instead of blocking boot**, like Ghost: `enabled: Boolean(SENTRY_DSN)`, so a missing
  `SENTRY_DSN` disables the SDK entirely rather than throwing. Don't add a guard/throw for it.
- `enableLogs` and `enableMetrics` are the **stable top-level options** in SDK v10 — the
  `_experiments.enable*` forms are deprecated, don't reintroduce them.
- **Don't reach for `node --import` here.** Sentry's ESM docs prescribe
  `node --import ./instrument.mjs`, and that was tried: it changed nothing measurable. With a local
  `beforeSendTransaction` counting events, `tsx --import ./sentry.ts app.ts` and a plain first-line
  `import` both produced the identical transaction (`GET /ping/42`, 0 child spans). It only added a
  second wiring to keep in sync, so it was reverted to the plain import.
- **`disableInstrumentationWarnings: true` is silencing a known upstream gap, not a misconfiguration.**
  This app is on Express 5, which Sentry does not fully instrument
  ([getsentry/sentry-javascript#13674](https://github.com/getsentry/sentry-javascript/issues/13674) —
  closed with partial support): error monitoring works, but spans carry the raw path rather than the
  parametrized route. The SDK prints `[Sentry] express is not instrumented … use --import` on every
  boot regardless of how init is wired — reproduced with plain `node --import ./instrument.mjs app.mjs`,
  no tsx and no TypeScript, on Express 5.2.1. Don't "fix" it by rearranging the init; revisit when
  OTel ships Express 5 route instrumentation.
- `tracesSampleRate` is hardcoded to `1`. If production tracing volume becomes a cost concern, add a
  `SENTRY_TRACES_SAMPLE_RATE` env var back — it was dropped as an unused knob, not on principle.
- **`dataCollection: { userInfo: false, httpBodies: [] }` is a privacy decision, not a default.**
  Sending request bodies or user identity to Sentry would put an employee↔submission link for
  `POST /api/mood-check-ins` into a third-party system — exactly the link the mood check-in
  invariant forbids anywhere. `userInfo: false` happens to match the SDK default; `httpBodies: []`
  does **not** (the default collects all bodies). Don't loosen either without excluding the mood
  routes first.
- `Sentry.setupExpressErrorHandler(app)` goes **after** every route and before `listen` — it is the
  error handler, so anything mounted after it is not covered.
- **Log with plain `console.*`; `Sentry.consoleLoggingIntegration()` is what ships those to Sentry
  Logs.** A winston logger with `createSentryWinstonTransport` was built here and then removed as
  redundant once `enableLogs` was on. The integration is **not** a default — the default `Console`
  integration only records breadcrumbs — so if it is ever dropped from `integrations`, `console.*`
  keeps printing locally but silently stops reaching Sentry. Don't reintroduce a logging library
  without a reason `console.*` can't cover.
- `src/middleware/request-metrics.ts` is mounted **first**, ahead of `helmet`, so it times the whole
  request. It records `http.server.duration` (distribution) and `http.server.request` (count),
  attributed by method/route/status. `route` is `req.baseUrl + req.route?.path` — the *pattern*,
  never `originalUrl`, which would blow up metric cardinality with row ids.
- `SIGTERM`/`SIGINT` run `server.close()` → `closeAllConnections()` → `Sentry.close(2000)` so
  buffered events survive a container stop. Uncaught exceptions and unhandled rejections are left to
  Sentry's own default integrations — don't add `process.on('uncaughtException')` handlers, which
  would swallow the crash the SDK expects to be fatal.

Console output still belongs in `core/messages.ts` (`serverMessages`), same as before.

**Blogs are the one integration that degrades instead of blocking boot.** `src/lib/ghost.ts`
deliberately does *not* follow the read-guard-throw pattern: it exports `ghostApi` as
`GhostContentAPI | null`, built only when both `GHOST_API_URL` and `GHOST_CONTENT_API_KEY` are set.
Both routes in `src/routes/blogs.ts` early-return `503` with `blogMessages.NOT_CONFIGURED` when it's
`null`. The reason is blast radius: `index.ts` → `routes/index.ts` → `routes/blogs.ts` →
`lib/ghost.ts`, so an import-time throw there takes down the *entire* API — auth, users, every
vertical — over an optional external CMS. The guarded vars above are all things the app genuinely
cannot run without; Ghost isn't. Follow this nullable-client shape for any future optional
third-party integration, and keep the throw-at-import pattern for anything load-bearing.

`CLIENT_URL` and `BETTER_AUTH_URL` hold the same value (`http://localhost:5173` in dev, `:5174` under
e2e) but are separate vars: `CLIENT_URL` is what app code reads (CORS origin, `trustedOrigins`);
`BETTER_AUTH_URL` is what Better Auth reads for its own derived URLs. Set both.

`prisma/seed.ts` provisions **one** bootstrap admin (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_NAME`) — solves
the chicken-and-egg problem of sign-up being disabled. Create-if-absent, not upsert, so it never
clobbers a display name Zoho already wrote. Missing either var → `MISSING_SEED_ENV_VARIABLES`, exit
1; an address outside `ALLOWED_EMAIL_DOMAIN` also throws (only domain is validated, not format).

**Seeding is always explicit under Prisma 7** — neither `migrate dev` nor `migrate reset` seeds
anymore. Run `npm run db:seed` after either. `db:seed` calls `tsx prisma/seed.ts` directly rather than
`prisma db seed`, so keep `prisma.config.ts`'s `migrations.seed` in sync if you change either.

Everyone else: `npm run db:studio`, add a `user` row (generated UUID `id`, `@dahnay.com` address, any
`name` — Zoho overwrites on first link, `emailVerified: false`, desired `role`).

`src/lib/auth/email-domain.ts` (not `auth.ts`) holds the domain rule so the seed can reuse it without
triggering `betterAuth()` init (which would demand Zoho credentials).

`npm install` does **not** generate the Prisma client (postinstall blocked by `allowScripts`) — run
`npm run db:generate` after cloning and after schema changes.

**e2e/**

`npm test` runs the suite; everything test-related lives here (no test scripts/`​.env.test` in
`server/`/`client/`).

**Delegate test writing to the `e2e-test-writer` subagent — never write specs yourself.** Launch via
Agent tool whenever a test needs writing/updating/debugging; hand it the feature and flows, it reads
source itself. It's also the reference for how the e2e run is wired — consult
[.claude/agents/e2e-test-writer.md](./.claude/agents/e2e-test-writer.md) before touching
`playwright.config.ts`, `test-env.ts`, or `.env.test`; keep testing guidance there, not here.

Limits: it writes under `e2e/` only (a `data-testid` it needs is yours to add in `client/`), and it
never commits.

**e2e scope: happy path only, and only what component tests structurally can't reach.** Component
tests mock `@/lib/api` — they prove a component renders/validates/calls the mutation correctly given
a canned response, but never touch a real Express route, real Postgres row, real session cookie, or a
real page navigation/refetch. That gap is what e2e is for. Before writing an e2e spec, check whether
a `client/src/components/**/test/*.test.tsx` already covers the behavior (field validation, error
branches, disabled/loading states, dialog open/close, per-row UI logic) — if so, don't re-assert it
in Playwright just because it's "more end-to-end"; that's duplicate coverage of the same assertion
through a slower runner. Reserve e2e for: signed-in navigation to the real route, a real create/
update/delete round-tripping through the actual API into the actual DB and back into the rendered
list, and any multi-page or auth-dependent flow a mocked-axios component test can't assemble. Skip
sad-path/error-state coverage in e2e when the equivalent already exists as a component test.

**e2e conventions:**

- Nest `test.describe` blocks by CRUD action (`describe('Create User')`, `describe('Edit User')`, …),
  one behavior per `test`, rather than one long test walking the whole flow.
- Attach `page.waitForResponse((res) => res.url().includes(...) && res.request().method() ===
  'POST')` *before* the click/submit that triggers the request, then `await` the returned promise
  after — attaching the listener after the click risks missing a response that resolves faster than
  the listener attaches.
- Assert the response status explicitly and throw a descriptive error with the response body on
  failure (`if (status !== 201) throw new Error(...)`) instead of relying only on the eventual UI
  assertion — a status/body mismatch is far more diagnosable than a generic 30s `toBeVisible()`
  timeout with no context.
- Scope row assertions with `page.getByRole('row').filter({ hasText: uniqueValue })`, and pass `exact:
  true` on cell/text matchers against user-generated data — one row's value can be a substring of
  another's (e.g. two test users created back-to-back sharing a name prefix).
- After an update or delete, assert the *old* value is gone (`not.toBeVisible()`) in addition to
  asserting the new state appeared — a positive-only assertion won't catch a stale re-render.
- Sessions are forged directly rather than logged in through the real UI — see "e2e is a second full
  app copy" under Architecture for why Zoho SSO can't be exercised from a test.

**client/ (component tests)**

Playwright (`e2e/`) is the end-to-end runner against the full client+server stack. Vitest + React
Testing Library is a second, separate runner for **client component tests** — isolated
loading/error/success-state and composition checks for a single component, not full user flows (those
stay in `e2e/`; don't duplicate coverage across both).

**Writing component tests:**

- Colocate `*.test.tsx` directly beside the component it tests, same directory, same base name
  (`components/users/UsersTable.tsx` → `components/users/UsersTable.test.tsx`), importing the subject
  from `'./UsersTable'`. No `test/` subfolder.
- Don't build a shared fixture module up front — inline mock data per spec (a small `const mockUsers =
  [...]` at the top of the file). Only pull a genuinely-duplicated non-trivial builder into a plain
  sibling file (e.g. `components/users/users-fixtures.ts`, never a `test/index.ts`) once a second spec
  needs the exact same one, as `UsersTable.test.tsx`/`UsersPagination.test.tsx`/
  `EditUserDialog.test.tsx`/`UserForm.test.tsx` do with `users-fixtures.ts`'s `makeUsersResponse`/
  `makeUserDetail`.
- Config lives in `client/vite.config.ts`'s `test` block (`environment: 'jsdom'`, `setupFiles:
  ['./src/test/setup.ts']`, `testTimeout: 15_000`) — note `defineConfig` there imports from
  `vitest/config`, not `vite`, so the `test` field type-checks; keep that import if you touch the file.
  The raised `testTimeout` is load-bearing: the heaviest `userEvent` specs (`UserForm.test.tsx`'s
  submit tests) run ~4–5s alone and intermittently blew the 5s default when the full suite ran them in
  parallel — an interaction-heavy spec failing *only* in a full run is that flake, not a real break;
  confirm by running the file on its own before chasing it.
- `client/src/test/setup.ts` wires `@testing-library/jest-dom/vitest` matchers and RTL `cleanup()`
  after each test (globals are **off** — import `describe`/`it`/`expect`/`vi`/etc. from `'vitest'`
  explicitly in every spec, consistent with `verbatimModuleSyntax` elsewhere in this repo). It also
  carries the **jsdom capability polyfills** the component tree needs — these are environment gaps,
  not mocks, so they belong here rather than per-spec: `matchMedia` and `scrollIntoView` (absent in
  jsdom); `ResizeObserver`, which must *invoke its callback* with a non-zero `contentRect` (a no-op
  stub leaves recharts measuring 0×0 and logging "width(0) and height(0) of chart should be greater
  than 0"); and `Range.prototype.getBoundingClientRect`/`getClientRects`, which jsdom omits even
  though it implements the `Element` versions — Lexical calls the `Range` one when it scrolls the
  selection into view, and without it `MarkdownEditor.test.tsx` throws an *unhandled* `TypeError`
  that Vitest reports separately from the pass count.
- `client/src/test/render.tsx` exports `renderWithQueryClient(ui)` — wraps `ui` in a fresh
  `QueryClient` (`retry: false`) per call. Use it for any component that calls `useQuery`/
  `useMutation`; a shared/cached client across tests would leak state between them. It doesn't wrap
  `MemoryRouter` — add that wrapping locally in a spec (or extend the helper) the first time a tested
  component calls `useNavigate`/renders a `Link`.
- Mock the shared axios instance directly — `vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))`
  — rather than reaching for a network-mocking library; none is installed, and none should be added
  for this alone.
- Reset mocks per spec, not globally: `beforeEach(() => vi.resetAllMocks())` at the top of the file —
  keep `src/test/setup.ts` limited to jest-dom matchers + RTL `cleanup()`.
- Unlike e2e, **write these yourself** — the `e2e-test-writer` subagent is Playwright-only (see its
  scope in [.claude/agents/e2e-test-writer.md](./.claude/agents/e2e-test-writer.md)) and doesn't cover
  `client/` component tests.

**Executing:** `npm test` in `client/` (`vitest run` — single pass, not watch mode).

Testing was originally slated for Phase 6; component tests now exist ahead of that, but e2e specs are
still unwritten.

**.claude/** — committed and shared:

- `.claude/agents/security-reviewer.md` — auth-bypass/access-control/privacy-invariant review; use
  before landing anything touching `auth.ts`, middleware, or a new endpoint.
- `.claude/agents/e2e-test-writer.md` — writes the Playwright suite and documents the test setup.
- `.claude/skills/better-auth-best-practices/` — guidance `auth.ts` follows.

`.claude/settings.local.json` is machine-local, must not be committed (untracked here only via a
global ignore rule — add it to `.gitignore` if it ever surfaces in `git status`).

## Architecture

**Single-origin in dev.** Browser only talks to `:5173`; `client/vite.config.ts` proxies `/api` to
Express, so client code uses relative paths (`src/lib/api.ts` = axios with `baseURL: '/api'` only).
Don't introduce absolute API URLs or a `VITE_API_URL`-style var without reworking the proxy — proxy
target is `process.env.API_PROXY_TARGET ?? 'http://localhost:3000'`, deliberately un-prefixed so
Vite (Node-evaluated) never inlines it into the browser bundle. Override the target, never the
client's `baseURL`.

API port `3000` appears in four places: `server/.env.example`, `src/index.ts` default, Vite proxy
fallback, `clientMessages.API_DISCONNECTED`. Change all four together.

Routing is client-side (`BrowserRouter`); Vite serves `index.html` for unknown paths — whatever hosts
the built client must do the same or `/login` 404s on refresh.

`CLIENT_URL`/`BETTER_AUTH_URL` are both `http://localhost:5173` (the client origin, not the API port)
since CORS, `trustedOrigins`, OAuth redirect URI and cookie domain all derive from it.

**Middleware order in `server/src/index.ts` is load-bearing:** `requestMetrics` → `helmet` → `cors` →
`authRateLimit` (`/api/auth`) → Better Auth handler → `apiRateLimit` (`/api`) → `express.json()` →
routes → `Sentry.setupExpressErrorHandler`.

- Better Auth handler (`app.all('/api/auth/*splat', ...)`, Express 5 named wildcard) must precede
  `express.json()` — it reads the raw body itself; a JSON parser consuming it first hangs auth
  requests silently.
- `authRateLimit` must precede the handler it protects.
- `apiRateLimit` sits after the auth handler so auth traffic isn't double-counted against both
  budgets.

**Three independent TypeScript programs, deliberately different:**

- `server/` — ESM `NodeNext`, ES2023, `noEmit`, strict + `noUncheckedIndexedAccess` (indexed access
  is `T | undefined`) + `noImplicitOverride`/`noUnusedLocals`/`noUnusedParameters`/
  `noFallthroughCasesInSwitch`. `src/*`/`core/*` aliases; `include` covers `prisma.config.ts`,
  `prisma/seed.ts`, `../core` — don't drop `include` or default `**/*` pulls in the generated Prisma
  client. Imports use the **`.ts`** extension (`allowImportingTsExtensions` + `tsx` runtime
  resolution) — only works because nothing is emitted; a real build needs
  `rewriteRelativeImportExtensions` or `.js` specifiers instead.
- `client/` — solution-style `tsconfig.json` referencing `tsconfig.app.json` (app source, bundler
  resolution, ES2023) and `tsconfig.node.json` (Vite config). `erasableSyntaxOnly` on (no enums/param
  properties). `@/*` → `./src/*` alias declared **three times** (`tsconfig.app.json`,
  `vite.config.ts` `resolve.alias`, and root `tsconfig.json` for the shadcn CLI) — keep all three in
  sync. Root config has no `baseUrl`; if `shadcn add` fails to resolve `@/components`, try restoring
  `"baseUrl": "."` first.
- `e2e/` — ESM `NodeNext`, `noEmit`, plain `strict`, no aliases, no `core/*`, `.js` import extensions.
  See [.claude/agents/e2e-test-writer.md](./.claude/agents/e2e-test-writer.md).

All three set `verbatimModuleSyntax` — type-only imports must use `import type { ... }`.

**`core/` is shared source, compiled twice** (no imports, no dependencies, no `package.json`, no
build step — must satisfy the stricter of both tsconfigs):

- `core/messages.ts` — `statusMessages`, `clientMessages`, `envMessages`, `seedMessages`, keyed
  `SCREAMING_SNAKE_CASE`. Page content/labels/transient loading copy stay in components — see
  Conventions.
- `core/constants.ts` — reusable non-message `as const` values. `roles` mirrors the `Role` Prisma enum
  (client can't import the generated enum, and `erasableSyntaxOnly` bans a real enum here — keep the
  two in step by hand). `environment` is the other cross-cutting one. Constants go here, never in
  `messages.ts`. **`roles` exists only for client code** — server-only code (middleware, schemas)
  should import the generated `Role` from `src/generated/prisma/client.ts` directly instead, as
  `auth.ts`/`require-admin.ts`/`schemas/users.ts` already do (e.g.
  `z.enum(Role, 'message')` for a role query param) — it's the actual source of truth and needs no
  hand-syncing.
- `core/types.ts` — request/response contracts (`HealthResponse` etc.), applied on both ends: client
  passes it to `api.get<T>`, server types the handler's `res` as `Response<T>` so a changed response
  body fails `tsc` server-side instead of surfacing as `undefined` in the browser.

Wiring (five entries, four files, all load-bearing): `server/tsconfig.json` `paths`+`include`
(`.ts`-extension imports); `client/tsconfig.app.json` same alias, no-extension imports;
`client/tsconfig.json` third declaration for shadcn; `client/vite.config.ts` `resolve.alias` (bare
`core`, matching server's bare `src/*`) and `server.fs.allow` (explicitly `[client dir, '../core']` —
don't widen to `allow: ['..']`, which would expose `server/.env`).

**Server state = TanStack Query; client state = Zustand. Never `useState`+`useEffect` for either.**

- API data: `useQuery`/`useMutation` with the shared axios instance as `queryFn`; always forward
  `signal` (`api.get('/health', { signal })`). Render off `isPending`/`isSuccess`/`isError` — don't
  copy results into local state or hand-roll a status union. Shared `QueryClient`
  (`src/lib/query-client.ts`, mounted in `main.tsx`) defaults `retry: false`, `staleTime: 30_000`;
  override per-query rather than editing defaults.
- Everything else (esp. cross-component UI state): a Zustand store under `src/stores/`
  (`create<T>()((set) => ({ … }))`, named actions not raw setters, one selector per subscribed value).
  A discriminated union is still right once a store has 3+ states; `sign-in-store.ts` (just
  `error: string | null`) doesn't need one yet. Plain modules — non-React code can drive them via
  `useStore.getState().action()`.

**Never add in-progress state around `signIn.oauth2()`** (e.g. disabling the button, "Redirecting…").
`oauth2()` hands the browser to Zoho, which bfcache-freezes the page; pressing Back resumes the same
JS heap with no re-render, so the flag would be stuck permanently on. No `pageshow`/`persisted`
listener exists here on purpose — the button stays enabled/unlabelled instead. Same trap applies to
any state set immediately before an off-origin redirect.

**e2e is a second full app copy** against a throwaway DB (`intranet_test`, API `:3001`, client
`:5174`, config in `e2e/.env.test`) — wiring details in
[.claude/agents/e2e-test-writer.md](./.claude/agents/e2e-test-writer.md), read before touching
`playwright.config.ts`/`test-env.ts`/`.env.test`. Real Zoho SSO isn't reachable from a test (redirect
URI is registered against `:5173`) — tests forge a session. `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`
(lets the e2e run reset its DB) is scoped to that one server — never export globally or add to
`server/.env`, or it stops protecting the dev database.

**Mood check-in is a privacy constraint, not just a feature.** One submission/employee/day, enforced
*without* any queryable link between employee and submission. No role (including Admin) may retrieve
an individual response — aggregates only. Shapes the Phase 4 schema; not retrofittable.

## Conventions

- **Centralize messages in `core/messages.ts`; never centralize UI content.** A **message** reports
  an operation's outcome/state and could plausibly be reused/asserted elsewhere; **content** is a
  screen's copy and belongs to its component. Goes in `core/`: error copy shown to users, HTTP status
  bodies, console output, thrown env/seed errors. Stays inline: headings, button/link labels
  (including pending variants like `'Signing out…'`), transient loading copy (`'Loading...'`,
  `'Checking...'`), app name/tagline, field labels/placeholders, marketing copy. When genuinely
  ambiguous, leave it inline — easy to extract later.
  - Transient status copy is deliberately inline (`ProtectedRoute`/`AdminRoute`'s `'Loading...'`,
    `ApiStatus`'s `'Checking...'`) since nothing else reads or asserts on it; the error branch
    (`clientMessages.API_DISCONNECTED`) stays centralized. Don't move spinner text back.
  - A third bucket — values **both sides must agree on exactly** (`roles.admin`,
    `apiStatusLabels.ok`) — goes in `core/constants.ts`, not `messages.ts`. Test: would a typo break
    a comparison, not just read badly.
  - Messages are named exports grouped by audience (`statusMessages`, `clientMessages`,
    `envMessages`, `seedMessages`), keys `SCREAMING_SNAKE_CASE`. Interpolated messages are functions
    (`seedMessages.ADMIN_CREATED(email)`).
  - JSX entities (`&hellip;`/`&mdash;`) become literal `…`/`—` once moved into `core/`. The rejected
    sign-in message is deliberately terser than `clientMessages.ACCESS_DENIED` (allowlist privacy) —
    both `databaseHooks` rejections in `auth.ts` throw the *same* `statusMessages.FORBIDDEN`; change
    both together.
- **No code comments in `client/`, `server/`, or `e2e/`** — no explanatory comments, section banners,
  JSDoc, `// TODO`. Applies to config files and `schema.prisma` too. `.env.example` files are
  commented normally (not code). Non-obvious/load-bearing decisions belong here or in `docs/`.
  Exceptions: comments tooling itself requires (e.g. a targeted oxlint suppression), and the
  domain-section banners in `client/src/index.css` (see the ordering rule below) — that one file is
  ~1300 lines of flat class definitions and the banners are how you navigate it.
- **Styling: Tailwind v4 utilities + shadcn/ui, no hand-written CSS.** `client/src/index.css` is the
  only stylesheet (shadcn `init` output only — imports, `@theme inline`, `:root` palette,
  `@layer base` reset). No `tailwind.config.js` (v4 is CSS-first).
- **`client/src/index.css` is ordered by domain, and new classes go in the matching section.** Top to
  bottom: `@import`s → `@theme inline` → `@keyframes` → shadcn `:root` palette (+ dark) → `--login-*`
  tokens (+ dark) → `--home-*` tokens (+ dark) → `@layer base` → `@layer components`. Inside
  `@layer components` the order is: shared layout primitives → shared form primitives → admin (page
  chrome, empty/error states, cards & lists, article sheet, skeletons, table) → auth shell → landing
  page → app shell (nav, footer) → employee page chrome → employee empty/error states → employee
  skeletons → feed pagination → home shell/masthead/section chrome → home widgets (banner slider,
  announcements, events, birthdays, recently joined, quick links, blog posts) → content verticals
  (`bulletin-*`, `timetable-*`, `library-*`, `press-*`, `roster-*`) → mood check-in. Each section has
  a `/* … */` banner — these are the file's navigation aid and are the one deliberate exception to
  the no-comments rule below; keep them accurate when you add a class.
- **Before writing a multi-utility className, check `@layer components` in `client/src/index.css`
  for an existing class, and reuse it instead of retyping the utility string.** `.page-stack`,
  `.card-grid`, `.form-field` (`space-y-1.5`, every form's label/input/error wrapper),
  `.date-trigger-compact`, `.auth-shell`/`.auth-card`/`.auth-seal`/`.auth-title`
  (the full-screen centered-card shell shared by `LoginPage.tsx` and `MaintenancePage.tsx`), and the
  rest of that layer exist precisely so admin and employee-facing components don't re-derive the same
  utility combination. When you notice the same non-trivial className string (roughly 2+ utilities)
  appear a second time — in either admin or employee-facing code, or across the two — add it to this
  layer as a new `@apply` class and repoint both call sites, rather than leaving the duplication or
  inventing a locally-scoped one-off. Don't extract a string that only appears once, and don't fold in
  a utility that varies between call sites (e.g. differing padding) — only lift what's actually
  identical.
  - **Never put a `@layer components` class on a shadcn component when the two set the same CSS
    property — the class silently loses.** `cn()` is `tailwind-merge`, which only de-duplicates
    utilities it *recognizes*; a custom class like `.filter-badge` is opaque to it, so the component's
    own base utility survives in the class list, and `@layer utilities` beats `@layer components` in
    the cascade. Inline utilities are the correct tool there — that is exactly what `cn()` exists to
    merge. Concretely, these extractions were tried and reverted: `.filter-badge`
    (`rounded-sm px-1 font-normal`) lost to `Badge`'s `rounded-4xl px-2 font-medium`; `.skeleton-line`
    (`h-3 rounded-full`) lost to `Skeleton`'s `rounded-md`; `.time-input` (`px-1.5`) lost to `Input`'s
    `px-2.5`. Worse, `CardHeader`'s base carries `[.border-b]:pb-(--card-spacing)` — a variant keyed on
    the *literal* `border-b` class — so folding `border-b border-(--home-line)` into a
    `.home-card-header` class silently dropped the header's bottom padding. Before extracting, read the
    target component's base `cva`/`cn` string; if it names the same property, leave the utilities
    inline. A class is safe when it lands on a plain DOM element, or when the base sets no competing
    property (`.dateline-badge` on `Badge` — no margin in the base; `.skeleton-action` on `Skeleton` —
    no size in the base; `.table-cell-optional` on `TableCell`/`TableHead` — no `display` in the base).
  - **Known pre-existing instance of this trap:** `.date-trigger-compact`
    (`w-full min-w-0 justify-start font-normal`) is applied to `Button` in `BannerForm.tsx` and
    `UserForm.tsx`, but `Button`'s base already sets `justify-center` and `font-medium` — so only
    `w-full`/`min-w-0` actually take effect and those date triggers render centered and medium-weight.
    `EventForm.tsx` deliberately keeps `min-w-0 justify-start font-normal` inline instead (its date
    button sits in a `.date-time-row` grid track, so it needs no `w-full`), and that one renders as
    intended. Left as-is because fixing it changes admin appearance — raise it before "cleaning up".
  - **Layout primitives are shareable across domains; visual identity is not.** Login (`LoginPage.tsx`),
    employee-facing pages (`AppLayout`/`HomePage`/content verticals), and Admin (`AdminLayout` and
    everything under `components/admin/`) are three distinct style domains. A class that's pure
    structural scaffolding with no look of its own — spacing rhythm, grid tracks, flex wrapping, a form
    field's label/input/error stack (`.page-stack`, `.card-grid`, `.form-field`, `.date-trigger*`) —
    stays shareable across all three, same as today. A class that gives a component its distinct visual
    identity (a card shell, a decorative treatment, a page-specific composition) should **not** be
    lifted into a shared class across domains going forward — write it once per domain, even if the
    utility string briefly matches another domain's. `.auth-shell`/`.auth-card`/`.auth-seal`/
    `.auth-title` (shared by `LoginPage.tsx` and `MaintenancePage.tsx`) is a pre-existing, deliberate
    exception — kept as-is, not a precedent to extend. shadcn/ui components (`components/ui/`) are
    exempt entirely — vendored primitives, not domain styling. When it's ambiguous whether a class is
    structural or identity, ask before extracting it.
- **The app is mobile-first — build every component this way from the start**, not as a later pass.
  Base (unprefixed) Tailwind classes target the smallest viewport; `sm:`/`md:`/`lg:`/`xl:` layer on
  progressively larger layouts. `docs/implementation-plan.md` states this as a standing rule across
  every phase, not a deferred Phase 6 item. **This applies to the admin panel exactly as much as to
  employee-facing work** — a change under `components/admin/` is not exempt just because it's
  operator-facing; ship it responsive from the first draft, not as a follow-up pass. `AdminSettingsPage.tsx`/
  `SettingsForm.tsx` (single-column stacked fields, no fixed-width popovers/dialogs) are a clean
  example of an admin feature that needed no separate mobile pass because it was built this way from
  the start.
  - Most of the app already follows this correctly — don't assume otherwise. `AppLayout.tsx`,
    `NavBar.tsx`, and `Footer.tsx` are now deliberately **full-bleed** (no `max-w-5xl`/`lg:max-w-6xl`
    cap — just `px-4 sm:px-6` edge padding), matching `AdminLayout.tsx`'s width so the two shells are
    visually consistent; this was a deliberate width-consistency change, not a regression, so don't
    reintroduce a centered max-width on the shell without the same request in reverse. It doesn't
    currently narrow any employee-facing reading column, because none of Phase 3's employee-facing
    list/detail views exist yet — `HomePage` is still just a greeting. If a future Phase 3 article/detail
    view wants a narrower text column for readability, give *that content component* its own max-width
    (like `.article-sheet`'s admin-only usage today), rather than reintroducing a cap on the shared
    shell. `AdminLayout.tsx`/`AppSidebar.tsx` render the vendored `ui/sidebar.tsx` primitive, which
    already branches on `useIsMobile()` (768px) to swap the desktop panel for a `Sheet`-based drawer —
    `SidebarTrigger` is always in the header, so the drawer is reachable at any width; don't "fix" this
    path, it's already correct. Every CRUD vertical's Create/Edit forms use `grid-cols-1 sm:grid-cols-2`
    field grids, and every list-view toolbar/filter bar is `flex flex-wrap` — both are already
    mobile-safe as written.
  - The five content verticals' list views (`AnnouncementList.tsx`, `EventList.tsx`,
    `QuickLinkList.tsx`, `ResourceList.tsx`, and `BannerGrid.tsx`) all render the same
    `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` card grid — keep new list views consistent
    with this pattern rather than a plain `flex flex-col` stack.
  - `UsersTable.tsx` hides its less-critical columns (email/department/designation) below `sm` via
    the `.table-cell-optional` class (`hidden sm:table-cell`) on the relevant `TableHead`/`TableCell`s,
    rather than only relying on `ui/table.tsx`'s inherited `overflow-x-auto`. Apply the same
    column-hiding treatment to any new wide `<table>`-based admin view instead of shipping it
    table-only.
  - A few fixed-width elements were found and fixed: `UserForm.tsx`'s "reports to" combobox
    `PopoverContent` was a bare `w-80` (320px, no margin at all on a 320px phone) — now
    `w-[min(90vw,20rem)]`. `MoodCheckInModal.tsx`'s 5-emoji row overflowed a 320–375px dialog because
    button size/gap never shrank below `sm:` — simplified to one `size-11`/`gap-1.5` tier (no `sm:`
    tier at all) plus `flex-wrap` as a fallback, rather than a two-tier responsive scale. Prefer this
    kind of single-tier fix over adding more breakpoint variants when a component doesn't need to look
    different at different sizes, just fit.
  - Left alone, deliberately: `AdminLayout.tsx`'s header is a fixed `h-14`; `ui/sidebar.tsx`'s mobile
    drawer width is a fixed `18rem`. Both are normal, expected fixed sizing for their role, not
    bugs — don't "fix" them without a concrete complaint.
  - `EventForm.tsx`'s Start/End date-time rows were widened after a concrete complaint (cramped in a
    2-up `form-grid-2`): each row is now its own full-width `space-y-4` block (not side-by-side), and
    the date button shows the full `'PPP'` format (was `'PP'`) now that there's room. The time input
    keeps `px-1.5 text-center` and hides `::-webkit-calendar-picker-indicator`; the grid track beside
    it went `5.5rem` → `4.5rem` (chasing the blank space the hidden icon leaves) → back to `5.5rem`
    with `gap-2` — the final call was to keep the field's original width and lean on the gap for
    spacing, not shrink the field itself. Don't re-pack Start/End back into a `form-grid-2` without
    the same complaint in reverse.
  - `HomePage.tsx` is still just a greeting + `MoodCheckInModal` (Phase 3's active-announcements/
    events/quick-links/resources/birthdays homepage sections aren't built yet) — there's nothing to
    retrofit there; build it mobile-first when Phase 3 happens, don't treat its current bareness as a
    responsive bug.
- **Use theme tokens, not raw palette colors** (`bg-background`/`text-foreground`,
  `text-muted-foreground`, `text-destructive`, `bg-card`, bare `border`). Reach for raw utilities
  (e.g. `text-emerald-600 dark:text-emerald-400`) only where no token exists. Preflight strips
  default heading sizes/margins — headings need explicit utilities.
- **Dark mode follows the OS** — a deliberate edit from shadcn's class-based toggle default.
  `@custom-variant dark (&:is(.dark *));` is deleted (restoring Tailwind's `prefers-color-scheme`
  `dark:`), dark tokens live under `@media (prefers-color-scheme: dark) { :root { … } }`, and
  `<body>` carries `scheme-light-dark`. **Re-running `shadcn init` reverts both** — redo them, or add
  a ThemeProvider instead.
- **shadcn components are vendored source, not a dependency** — add via `npx shadcn@latest add
  <name>`, lands in `client/src/components/ui/`, ours to edit. Style is `base-nova` (Base UI, neutral,
  Geist, lucide). `button.tsx`/`card.tsx` are in. `src/lib/utils.ts` exports `cn`.
  - `ui/sonner.tsx` was edited to pass `theme="system"` directly instead of reading `next-themes`'
    `useTheme()`. There is no `ThemeProvider` in this app (dark mode follows the OS, see above), so
    the hook always returned its `"system"` default — `next-themes` was a dependency doing nothing and
    has been uninstalled. Re-running `shadcn add sonner` reinstates the import; drop it again.
- **A link styled as a button is a `<Link>`, never `<Button render={<Link/>}>`.** Base UI's docs are
  explicit that anchors "have distinct semantics and should not be rendered as buttons using the
  `render` prop" — style the `<a>` directly instead. `ui/button.tsx` exports `buttonVariants` for
  exactly this: `<Link to="…" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>`.
  Using `Button` here logs a `nativeButton` console warning, and "fixing" that with
  `nativeButton={false}` is worse — it swaps the accessible role from `link` to `button`, so keyboard
  and screen-reader users lose the navigation affordance (and `getByRole('link')` queries break). The
  four admin detail pages' Back links and `NavBar.tsx`'s Admin link all follow the `buttonVariants`
  form. Reserve `nativeButton={false}` for genuinely button-like non-button elements (a `<div>`).
- **Surface the server's actual error message, don't hardcode a generic string** for a query's error
  branch. `client/src/lib/get-error-message.ts` exports `getErrorMessage(error: unknown, fallback:
  string): string` — `axios.isAxiosError(error)` guard, returns `error.response?.data?.error ??
  fallback` (matches the `{ error: "..." }` shape `server/src/lib/validate.ts` and other route error
  responses use). Use it in a query's error branch: `{getErrorMessage(query.error, 'Failed to load
  X.')}` instead of a bare string — a non-axios error (network failure, etc.) still falls through to
  `fallback`. `client/src/components/ErrorAlert.tsx` wraps this for a mutation/query's error branch
  (an alert box rendering `getErrorMessage(error, fallback)`), and `ErrorMessage.tsx` renders a single
  zod field error under an input (`{errors.name?.message}`) — both used throughout `components/users/`.
- **Keep query params to simple scalars — comma-joined strings for multi-select, never arrays.**
  `client/src/lib/api.ts`'s `api` is a plain `axios.create({ baseURL: '/api' })` — no custom
  `paramsSerializer`. When a client-side control is multi-select (e.g. a faceted filter holding
  `string[]` in a Zustand store), join it into one comma-separated string before sending
  (`role: roleFilter.length ? roleFilter.join(',') : undefined`) rather than passing the array through
  to axios. Reason: Express 5 defaults `query parser` to `'simple'` (Node's `querystring`, no bracket
  support) where Express 4 defaulted to `'extended'` (`qs`) — axios's default array serialization
  (`role[]=Admin&role[]=User`) silently fails to parse under Express 5's default (`req.query.role` is
  `undefined`, filtering does nothing, no error). A comma-joined string sidesteps this permanently: it
  round-trips correctly under *any* query parser, so there's nothing left to keep in sync between
  client and server. Split and validate it back into an array in the zod schema
  (`z.string().optional().transform(v => v?.split(','))`, piped through `z.array(...)` for enum
  validation, e.g. `role` in `schemas/users.ts`) — never reach for a custom `paramsSerializer` again;
  simplify the wire shape instead of building serialization machinery to work around it. Same standard
  applies to future filter/sort params generally: prefer the flattest shape that survives an HTTP round
  trip over one that needs custom encode/decode code on either end.
- **Pass the response/data object through, don't destructure it at the call site.** When a child only
  needs a few fields off an object the caller already has (typically a `core/types.ts` response shape),
  give the child that object (or a `Pick<...>` of it) as one prop and destructure inside the child, not
  three or four individually-extracted props at the JSX call site. Example:
  `<UsersPagination pagination={users.data} onPageChange={setPage} />`, where `UsersPagination` takes
  `pagination: Pick<UsersResponse, 'page' | 'pageSize' | 'totalPages'>` and destructures `{ page,
  pageSize, totalPages }` internally — not `page={users.data.page} pageSize={users.data.pageSize}
  totalPages={users.data.totalPages}`. Keeps the call site short and the child's prop type documents
  exactly which fields it actually uses.
- **Extract shared CRUD dialog chrome once a second admin-CRUD vertical repeats it — don't
  pre-abstract for one.** `client/src/components/shared/CategoriesDialog.tsx`,
  `CreateEntityDialog.tsx`, `EditEntityDialog.tsx`, `DeleteEntityDialog.tsx` hold the
  category-manager / create / edit / single-item-delete dialog chrome that `banners/` and
  `announcements/` are otherwise byte-for-byte identical on (`banners/` was scaffolded straight from
  `announcements/`'s pattern). Each per-feature file (`banners/DeleteDialog.tsx`,
  `announcements/DeleteDialog.tsx`, etc.) stays a thin wrapper that supplies the entity-specific bits
  as plain props (`basePath`, `queryKey`/`invalidateKey`, `getTitle`, a `clientMessages` function,
  field labels) — never a config object or a registry — and keeps its **original external prop
  name** (`banner`/`announcement` on `DeleteDialog`, `id` on `EditDialog`) so existing call sites and
  component tests don't change. The entity's own form component is never genericized: pass it in via
  a render-prop `children` (`(data, onSuccess) => <BannerForm .../>`), since the fields and
  validation are feature-specific and forcing them through a shared shape would cost more than the
  duplication it removes. `users/`'s `CreateUserDialog`/`EditUserDialog`/`DeleteUsersDialog` are
  deliberately **not** wired to these — `DeleteUsersDialog` is bulk-delete over an array (no
  single-item shape to generalize against) and `EditUserDialog` needs the row's name in its
  `DialogDescription` before the detail fetch resolves (a real shape difference, not copy-paste).
  Don't "fix" that later without re-reading why it was excluded.
- **Validate request input with zod + the shared `validate()` helper**, not ad-hoc `Number()`/`Math`
  parsing. Define the schema in `server/src/schemas/<resource>.ts` (e.g. `usersListQuerySchema` in `schemas/users.ts` —
  `z.coerce.number().int().min(1).default(1)` for `page`, same with `.max(100)` for `pageSize`), then
  in the route: `const query = validate(schema, req.query, res); if (!query) return;` —
  `server/src/lib/validate.ts` calls `schema.safeParse`, and on failure writes the `400` itself
  (`{ error: <first zod issue message> }`, falling back to `core/messages.ts`'s
  `statusMessages.VALIDATION_FAILED`) and returns `null`, so the route only has an early-return guard,
  never its own manual clamping/`NaN` handling. Keep schemas free of DB lookups — a check like
  email/employeeId uniqueness belongs in the route, right after `validate()` succeeds, as a plain
  query (see `findConflictingField` in `server/src/routes/users.ts`, shared by `POST /` and
  `PUT /:id`), not inside a `.superRefine`. `usersCreateSchema` and `usersUpdateSchema`
  (`server/src/schemas/users.ts`) stay plain, symmetric schemas — only `withAllowedEmailDomain`'s
  `.refine()` (the Zoho-domain check, which needs no request-specific data) lives at the schema level.
  - **Every check gets its own custom message** — pass a plain string as the last argument to each
    zod method (`.min(1, 'Page must be at least 1')`, `.max(100, 'Page size cannot exceed 100')`,
    `.int('Page must be a whole number')`), including the base type
    (`z.coerce.number('Page must be a number')`). Zod v4 normalizes a plain string into its `error`
    param — don't use v3's `{ required_error, invalid_type_error }` shape. `validate()` surfaces only
    `result.error.issues[0]?.message`, so an unmessaged check falls back to zod's generic wording
    ("Invalid input", "Too small: expected number to be >=1") instead of something field-specific.
- **Don't wrap async route handlers in `try`/`catch` just to keep the process alive.** Unlike Express
  4, Express 5 automatically catches a rejected promise (or thrown error) from an `async` handler and
  forwards it to error-handling middleware — see
  [the Express 5 migration guide](https://expressjs.com/en/guide/migrating-5.html#rejected-promises).
  Let an error like Prisma's `P2025` (record not found on `update`/`delete`) propagate instead of
  catching it defensively; only reach for `try`/`catch` when a route needs to turn a *specific* error
  into a specific response the default error handler wouldn't give it.
- **Commits: Conventional Commits**, enforced by commitlint (`commitlint.config.js` →
  `@commitlint/config-conventional`). `type(optional-scope): subject`. Types: `build`, `chore`, `ci`,
  `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test` (lowercase, required). Subject:
  no leading capital, no trailing period, non-empty, ≤100 chars. Breaking changes: `type!: subject` or
  `BREAKING CHANGE:` footer.
  - **Single short subject line, no body** — aim ~50–72 chars (100 is the hard cap, not the target).
    A change needing a paragraph should usually be split into more commits.
  - **Commit in context-based groups, never one bulk commit** — split unrelated changes into separate
    commits in dependency order (remove consumer before consumed; add dependency before its use).
    Each commit stands alone and the tree builds at every commit. Group by *what changed and why*
    (source / dependency+lockfile / config / docs are usually separate), not by directory/file type.
    Prefer moving a whole file into one group over splitting its diff. Scope names the affected area
    (`feat(server):`, `chore(client):`, `docs:`).
- **Branches: only `dev` and `main` — never create a feature branch.** Commit directly on `dev`;
  `main` is the release branch, updated from `dev` only. Split large tasks into smaller `dev` commits
  instead of branching.
- PRs follow [.github/pull_request_template.md](./.github/pull_request_template.md).
- `.env` files are gitignored; only `.env.example` and `e2e/.env.test.example` are committed (the
  latter needs its own `!` negation in `.gitignore`). Document every new server variable in both
  unless it's irrelevant to e2e.
