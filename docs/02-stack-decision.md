# 02. Stack Decision

## Opcoes avaliadas

| Stack | Entrega | UI premium | Integracoes | Northflank | Manutencao |
| --- | --- | --- | --- | --- | --- |
| Next.js + NestJS + Prisma + Postgres | Melhor | Melhor | Melhor | Melhor | Melhor |
| .NET + React | Media | Media | Boa | Boa | Media |
| Django + React | Media | Media | Boa | Boa | Media |

## Decisao
- Stack escolhida: TypeScript monorepo com Next.js, NestJS, Prisma, PostgreSQL, Redis, BullMQ e Sentry.
- Motivo principal: maior velocidade para UX premium com Superdesign + shadcn, contratos compartilhados e melhor DX para rollout rapido.

## Componentes da stack
- Frontend: Next.js 16 App Router, React 19, Tailwind 4.
- Backend: NestJS 11.
- Banco: PostgreSQL 16.
- ORM: Prisma 7 com `prisma.config.ts`.
- Cache e filas: Redis 7 + BullMQ.
- Observabilidade: Sentry.
- Testes: Playwright + TestSprite como matriz auxiliar.
- Infra: Docker + Northflank.

## Regras fixas
- Sem MongoDB no core.
- Sem Convex no core.
- Cookies same-origin e auth propria no backend.
- Prisma em runtime Debian/bookworm-slim para reduzir atrito.
