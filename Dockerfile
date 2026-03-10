FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN corepack pnpm install --frozen-lockfile

FROM deps AS build
ARG VITE_API_URL=/api
ARG VITE_SENTRY_DSN=
ARG VITE_SENTRY_ENVIRONMENT=production
ARG VITE_SENTRY_RELEASE=
ARG VITE_SENTRY_TRACES_SAMPLE_RATE=0.2
ARG SENTRY_AUTH_TOKEN=
ARG SENTRY_ORG=
ARG SENTRY_PROJECT_WEB=
ARG SENTRY_RELEASE=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT
ENV VITE_SENTRY_RELEASE=$VITE_SENTRY_RELEASE
ENV VITE_SENTRY_TRACES_SAMPLE_RATE=$VITE_SENTRY_TRACES_SAMPLE_RATE
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT_WEB=$SENTRY_PROJECT_WEB
ENV SENTRY_RELEASE=$SENTRY_RELEASE
COPY . .
RUN corepack pnpm --filter @belezafoco/api prisma:generate
RUN corepack pnpm build

FROM base AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages/shared ./packages/shared
EXPOSE 3333
CMD ["node", "--enable-source-maps", "--import", "./apps/api/dist/src/instrument.js", "apps/api/dist/src/server.js"]

FROM api AS worker
CMD ["node", "--enable-source-maps", "--import", "./apps/api/dist/src/instrument.js", "apps/api/dist/src/worker.js"]

FROM caddy:2-alpine AS web
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv
