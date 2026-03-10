# BELEZAFOCO

SaaS multi-tenant para barbearias, salões, nail designers, estéticas e negócios locais de beleza.

## Stack

- Backend: Node 20 + TypeScript + Fastify + Prisma + Zod + JWT
- Frontend: React + Vite + Tailwind
- Banco principal: PostgreSQL
- Observabilidade: Sentry opcional por ambiente
- Jobs: comandos Node agendados por cron/systemd timer

## Núcleo do produto

- Multi-tenant por workspace com memberships e papéis
- Onboarding do negócio com branding, horários e checklist
- Agenda pública por slug com UX premium
- Serviços com buffers, preparo, finalização e política de sinal
- Profissionais, recursos compartilhados, exceções e bloqueios
- Scheduler com prevenção de conflito e locking transacional
- Lembretes 24h/2h com deduplicação
- Pagamento Pix com provider abstraído e webhook endurecido
- Billing do SaaS com trial/basic/pro
- Audit log, `health`, `ready`, rate limiting e logs estruturados

## Rodando local

```bash
cp .env.example .env
docker compose up -d postgres mailhog
corepack pnpm install
corepack pnpm prisma:generate
corepack pnpm prisma:migrate
corepack pnpm seed
corepack pnpm dev
```

API em `http://localhost:3333` e front em `http://localhost:5173`.

## Build e testes

```bash
corepack pnpm build
corepack pnpm test
corepack pnpm test:e2e
```

Os smoke tests E2E usam o booking demo em `/b/demo-beleza`, entao a camada visual pode ser validada mesmo sem backend local.

## Jobs

```bash
node apps/api/dist/src/jobs/sendReminders.js
node apps/api/dist/src/jobs/reconcilePayments.js
node apps/api/dist/src/jobs/cleanup.js
```
