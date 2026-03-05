# BELEZAFOCO

SaaS multi-tenant para barbearias, salões, manicure, maquiagem e estética.

## Stack
- Backend: Node 20 + TypeScript + Fastify + Prisma + Zod + JWT
- Frontend: React + Vite + Tailwind
- Banco MVP: SQLite (WAL)
- Jobs: comandos Node agendados por cron/systemd timer

## Funcionalidades implementadas
- Multi-tenant por Workspace com Membership e papéis
- Link público `/b/:slug` para agendamento sem conta
- Serviços com duração, buffers, política de sinal
- Profissionais, disponibilidade e recursos (cadeira/sala)
- Scheduler com prevenção de conflito (staff + resource)
- Agendamento com status e export CSV
- Waitlist com token de expiração
- Lembretes 24h/2h com deduplicação e providers (mock WhatsApp/email fallback)
- Pagamento PIX (Mercado Pago mock + webhook de reconciliação)
- Billing do SaaS (trial/basic/pro) com enforcement server-side
- Audit log para ações críticas
- /health, rate limiting e logs estruturados

## Rodando local
```bash
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
pnpm dev
```

API em `http://localhost:3333` e front em `http://localhost:5173`.

## Jobs
```bash
node apps/api/dist/jobs/sendReminders.js
node apps/api/dist/jobs/reconcilePayments.js
node apps/api/dist/jobs/cleanup.js
```

## Testes
```bash
pnpm --filter @belezafoco/api test
```
