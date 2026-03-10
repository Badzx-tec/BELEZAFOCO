# BELEZAFOCO

SaaS multi-tenant para barbearias, saloes, nail designers, esteticas e negocios de beleza.

## Stack atual

- Backend: Node 20 + TypeScript + Fastify + Prisma
- Frontend: React + Vite + Tailwind
- Banco principal: PostgreSQL
- Suporte operacional: Redis
- Jobs atuais: scripts Node para reminders, reconciliacao e cleanup

## Estado atual

A base atual tem bons sinais de direcao, mas a auditoria de 2026-03-09 concluiu que o produto ainda nao esta pronto para producao real. Os documentos abaixo registram o estado do repositorio, a decisao arquitetural final e o plano de hardening para levar o projeto a um SaaS vendavel.

## Subindo o projeto localmente

1. Copie `.env.example` para `.env`
2. Suba a infraestrutura:

```bash
docker compose up -d
```

3. Instale dependencias:

```bash
corepack pnpm install
```

4. Gere o Prisma Client:

```bash
corepack pnpm --filter @belezafoco/api prisma:generate
```

5. Rode build e testes:

```bash
corepack pnpm -r build
corepack pnpm -r test
```

## Documentacao principal

- `docs/01-technical-audit.md`
- `docs/02-architecture-decisions.md`
- `docs/03-production-checklist.md`
- `docs/04-deploy-digitalocean.md`
- `docs/05-integrations-whatsapp-mercadopago.md`
- `docs/06-sales-positioning.md`
- `docs/07-testing-strategy.md`
- `docs/08-mcp-usage-log.md`
- `docs/09-deploy-northflank.md`
