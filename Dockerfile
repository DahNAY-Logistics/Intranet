FROM node:24-bookworm-slim AS base

WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Stage 1: Install dependencies
FROM base AS install

COPY core/package*.json ./core/
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN cd core && npm ci
RUN cd client && npm ci
RUN cd server && npm ci

# Stage 2: Build
FROM install AS build

COPY . .

# Build-time placeholder only -- prisma generate never connects; real DATABASE_URL is supplied at container start.
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ARG VITE_SENTRY_DSN=""

RUN cd server && npx prisma generate
RUN cd client && npm run build

# Stage 3: Production
FROM base AS production

ENV NODE_ENV=production

COPY --from=install /app/core/node_modules ./core/node_modules
COPY --from=install /app/server/node_modules ./server/node_modules

COPY . .

COPY --from=build /app/server/src/generated ./server/src/generated
COPY --from=build /app/client/dist ./client/dist

USER node

CMD ["sh", "-c", "cd server && npx prisma migrate deploy && npm start"]
