# Deploy

## Baseline recomendada

- `PostgreSQL 16`
- `Node 20`
- `pnpm 9`
- `Caddy` como reverse proxy
- `Mailhog` apenas em desenvolvimento

## Variáveis essenciais

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `PUBLIC_URL`
- `MP_WEBHOOK_SECRET`
- credenciais do provider de WhatsApp/e-mail

## Desenvolvimento local

### 1. Suba a infraestrutura

```bash
docker compose up -d postgres mailhog
```

### 2. Configure o ambiente

```bash
cp .env.example .env
```

### 3. Gere client e aplique migrations

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
```

### 4. Rode a aplicação

```bash
pnpm dev
```

## Produção em VPS / DigitalOcean / Coolify

### Recomendações

- rodar PostgreSQL como serviço dedicado ou volume persistente
- usar Caddy/Nginx na frente
- configurar backup diário do banco
- monitorar `health` e `ready`
- separar `api` e `web` em processos independentes

## Healthchecks

- `GET /health`: processo vivo
- `GET /ready`: app + banco prontos para tráfego

## Backup

### PostgreSQL

Exemplo:

```bash
pg_dump "$DATABASE_URL" --clean --if-exists --format=custom --file=backups/belezafoco.dump
```

Restore:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" backups/belezafoco.dump
```

## Observabilidade mínima

- logs JSON no backend
- alertas para falha em webhook e jobs
- error tracking via Sentry ou equivalente na próxima fase

## Estratégia de atualização

1. `git pull`
2. `pnpm install --frozen-lockfile`
3. `pnpm prisma:generate`
4. `pnpm prisma:migrate`
5. `pnpm build`
6. restart ordenado de `api` e `web`
