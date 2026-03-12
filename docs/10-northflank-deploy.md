# 10. Northflank Deploy

## Topologia alvo
- `web`: publico
- `api`: interno
- `worker`: interno
- addon PostgreSQL
- addon Redis
- job de migration
- job opcional de seed demo

## Runtime
- Node 22 bookworm-slim
- Prisma 7
- build standalone no `web`

## Variaveis esperadas
- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `APP_URL`
- `API_INTERNAL_URL`
- `CORS_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `SENTRY_DSN`

## Checklist de rollout
1. Criar addons PostgreSQL e Redis.
2. Subir secrets por ambiente.
3. Rodar migration job.
4. Validar `GET /api/v1/health/live`.
5. Validar `GET /api/v1/health/ready`.
6. Publicar release no Sentry.
7. Rodar smoke tests principais.
