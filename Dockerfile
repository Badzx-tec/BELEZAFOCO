FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3333
CMD ["node", "apps/api/dist/src/server.js"]
