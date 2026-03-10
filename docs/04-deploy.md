# Deploy

Atualizado em: 8 de março de 2026

## 1. Stack operacional

- API: Fastify em Node 20
- Frontend: React/Vite build estático
- Banco: PostgreSQL 16
- Suporte: Redis 7
- SMTP local opcional: Mailhog

## 2. Ambiente local

1. Copie `.env.example` para `.env`
2. Suba infraestrutura:

```bash
docker compose up -d
```

3. Instale dependências:

```bash
corepack pnpm install
```

4. Gere o Prisma Client e aplique migrations:

```bash
corepack pnpm --filter @belezafoco/api prisma:generate
corepack pnpm --filter @belezafoco/api prisma:migrate
```

5. Rode seed demo:

```bash
corepack pnpm seed
```

6. Suba a aplicação:

```bash
corepack pnpm dev
```

## 3. Build de produção

```bash
corepack pnpm build
```

API:

- `apps/api/dist`

Frontend:

- `apps/web/dist`

## 4. Docker

O `Dockerfile` atual gera a imagem da API já com build realizado.

Build:

```bash
docker build -t belezafoco-api .
```

Run:

```bash
docker run --env-file .env -p 3333:3333 belezafoco-api
```

## 5. Healthchecks

- `GET /health`
- `GET /ready`

Use `/ready` em load balancer, proxy reverso e monitoramento.

## 6. Migrations em produção

Depois de atualizar o código:

```bash
corepack pnpm --filter @belezafoco/api prisma:migrate:deploy
```

## 7. Banco e backup

Sugestão para backup diário com PostgreSQL:

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d-%H%M%S).sql
```

Boas práticas:

- backup diário automático
- retenção mínima de 7 a 14 dias
- teste periódico de restore

## 8. VPS / Coolify / DigitalOcean

Recomendação:

- PostgreSQL gerenciado ou container dedicado
- Redis dedicado
- API em container
- frontend servido por Caddy/Nginx
- domínio com SSL

## 9. Variáveis mínimas para produção

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `PUBLIC_URL`
- `APP_URL`
- `MP_WEBHOOK_SECRET`
- `SUPERADMIN_EMAIL`

## 10. Observabilidade sugerida

- Sentry via `SENTRY_DSN`
- monitoramento HTTP de `/health` e `/ready`
- retenção de logs estruturados
- alertas para falha de jobs de reminder e reconciliação
