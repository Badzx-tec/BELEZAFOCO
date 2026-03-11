# Northflank Deploy

## Objetivo

Preparar `api`, `worker` e `web` para deploy estável no Northflank com PostgreSQL, migrations previsíveis e rollback simples.

## Variáveis obrigatórias

- `DATABASE_URL`: conexão do runtime da API e worker
- `DIRECT_URL`: conexão direta para `prisma migrate deploy`
- `API_BASE_URL`: URL pública da API para webhooks
- `PUBLIC_URL`: URL pública do produto
- `APP_URL`: URL do web
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SENTRY_DSN`
- `VITE_SENTRY_DSN`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`

## Estratégia recomendada

1. Criar addon PostgreSQL.
2. Criar service `api` usando target `api` do `Dockerfile`.
3. Criar service `worker` usando target `worker`.
4. Criar service `web` usando target `web`.
5. Criar job de migrations com `corepack pnpm --filter @belezafoco/api prisma:migrate:deploy`.

## Health checks

- API liveness: `GET /health`
- API readiness: `GET /ready`
- Web liveness: `GET /healthz`
- Web readiness: `GET /readyz`

## Notas desta etapa

- o `Dockerfile` já está em `node:20-bookworm-slim`, compatível com Prisma no runtime
- `.env.example` e `northflank.env.example` foram atualizados para `DIRECT_URL` e `API_BASE_URL`
- a validação completa de `migrate deploy` ficou bloqueada nesta máquina por indisponibilidade do banco para novos processos CLI

## Rollback

- manter imagem anterior aprovada
- reverter service para o último deployment estável
- não rodar seed em rollback
- revisar Sentry e logs de webhook após rollback

## Observacao de demo

- `PUBLIC_DEMO_ENABLED=true` mantem o slug reservado `demo-beleza` funcional para demo comercial e smoke tests mesmo quando o staging sobe sem seed
- em ambientes com seed real de apresentacao, voce pode desligar o fallback reservando `PUBLIC_DEMO_ENABLED=false`
