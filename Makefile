# Repo-root task runner. This is not an npm workspace: root, core/, client/, server/
# and e2e/ install independently, so every target names the directory it runs in.
# Run `make help` for the target list.

NPM := npm

# Base ref that `lint-commits` compares this branch against.
LINT_COMMITS_FROM ?= origin/main

.PHONY: help install install-ci hooks db-generate db-migrate db-seed \
        lint lint-fix lint-commits typecheck check build clean \
        test test-client test-e2e test-e2e-ui test-e2e-headed \
        e2e-env e2e-browsers azurite \
        ci ci-test-e2e

# -- Setup ---------------------------------------------------------------

install:  ## Install all dependencies (npm install) and generate the Prisma client
	$(NPM) install
	cd core && $(NPM) install
	cd client && $(NPM) install
	cd server && $(NPM) install
	cd e2e && $(NPM) install
	$(MAKE) db-generate
	$(MAKE) db-migrate
	$(MAKE) db-seed

install-ci:  ## Same as install but from lockfiles only (npm ci) -- use this in CI
	$(NPM) ci
	cd core && $(NPM) ci
	cd client && $(NPM) ci
	cd server && $(NPM) ci
	cd e2e && $(NPM) ci
	$(MAKE) db-generate

hooks:  ## Install the Husky commit-msg hook (root install)
	$(NPM) install

db-generate:  ## Generate the Prisma client into server/src/generated/prisma
	cd server && $(NPM) run db:generate

db-migrate:  ## Apply migrations to the development database
	cd server && $(NPM) run db:migrate

db-seed:  ## Provision the bootstrap admin (SEED_ADMIN_EMAIL / SEED_ADMIN_NAME)
	cd server && $(NPM) run db:seed

# -- Linting -------------------------------------------------------------

lint:  ## Lint the client (oxlint)
	cd client && npx oxlint

lint-fix:  ## Lint the client and apply safe fixes
	cd client && npx oxlint --fix

lint-commits:  ## Lint this branch's commit messages against $(LINT_COMMITS_FROM)
	npx commitlint --from $(LINT_COMMITS_FROM) --to HEAD

typecheck: db-generate  ## Typecheck all three TypeScript programs (client, server, e2e)
	cd client && npx tsc -b
	cd server && npx tsc --noEmit
	cd e2e && npx tsc --noEmit

check: lint typecheck test-client  ## Fast local gate: lint + typecheck + component tests

# -- Testing -------------------------------------------------------------

test: test-client test-e2e  ## Run component tests, then the e2e suite

test-client:  ## Vitest component tests (single run, not watch mode)
	cd client && $(NPM) test

test-e2e:  ## Playwright e2e suite -- needs Postgres, Azurite and e2e/.env.test
	cd e2e && $(NPM) test

test-e2e-ui:  ## Playwright in UI mode
	cd e2e && $(NPM) run test:ui

test-e2e-headed:  ## Playwright with a visible browser
	cd e2e && $(NPM) run test:headed

e2e-browsers:  ## Install the Playwright browser (chromium) and its OS dependencies
	cd e2e && npx playwright install --with-deps chromium

# test-env.ts parses e2e/.env.test itself and ignores process.env, so CI needs the
# file on disk. The example's DATABASE_URL and BETTER_AUTH_SECRET are placeholders.
e2e-env:  ## Create e2e/.env.test from the example if it is missing
	@test -f e2e/.env.test || { \
	  cp e2e/.env.test.example e2e/.env.test; \
	  echo "Created e2e/.env.test from the example -- fill in DATABASE_URL and BETTER_AUTH_SECRET."; \
	}

azurite:  ## Run the Azure Blob Storage emulator in the foreground (uploads + e2e need it)
	cd server && $(NPM) run blob:emulator

# -- CI ------------------------------------------------------------------

ci: install-ci lint typecheck build test-client ci-test-e2e  ## Full CI pipeline

ci-test-e2e: e2e-env e2e-browsers  ## e2e for CI: boots Azurite, runs Playwright, tears it down
	cd server && npx azurite --silent --location .azurite --skipApiVersionCheck & \
	azurite_pid=$$!; \
	trap 'kill $$azurite_pid 2>/dev/null || true' EXIT; \
	cd e2e && $(NPM) test

# -- Build & cleanup -----------------------------------------------------

build:  ## Typecheck and build the client bundle
	cd client && $(NPM) run build

clean:  ## Remove build output and test artifacts (leaves node_modules alone)
	rm -rf client/dist client/node_modules/.vite
	rm -rf e2e/test-results e2e/playwright-report
	rm -rf server/.azurite
	find . -name '*.tsbuildinfo' -not -path '*/node_modules/*' -delete

help:  ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
