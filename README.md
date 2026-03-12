# BELEZAFOCO 2.0

Greenfield premium SaaS para negocios de beleza com Next.js, NestJS, Prisma, PostgreSQL, Redis, BullMQ e Northflank.

## Apps
- `apps/web`: marketing, auth, cockpit e booking publico.
- `apps/api`: API NestJS com prefixo `/api/v1`.
- `apps/worker`: jobs de lembrete, pagamentos e reconciliacao.

## Packages
- `packages/ui`
- `packages/sdk`
- `packages/types`
- `packages/database`

## Comandos
```bash
corepack pnpm install
corepack pnpm prisma:generate
corepack pnpm prisma:validate
corepack pnpm typecheck
corepack pnpm build
```

## Estado atual
- schema Prisma validado
- Prisma Client gerado
- web compilando
- api compilando
- backlog criado no Linear
- PRD e runbook publicados no Notion
