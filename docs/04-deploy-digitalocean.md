# Deploy na DigitalOcean

Data base: 2026-03-09

O repositorio agora tem os artefatos minimos para um deploy serio:

- imagem `web` para servir o build do Vite via Caddy
- imagem `api` para o Fastify
- imagem `worker` para reminders, cleanup e reconciliacao
- `docker-compose.yml` com `postgres`, `redis`, `api`, `worker` e `web`

Ainda falta validar um `docker compose up` completo em ambiente com Docker engine ativo e banco acessivel.

## Tamanho inicial recomendado

Opcao padrao:

- Droplet Basic
- 2 GiB RAM
- 2 vCPUs
- 60 GiB SSD

Opcao mais segura para os primeiros clientes:

- Droplet Basic
- 4 GiB RAM
- 2 vCPUs
- 80 GiB SSD

## Topologia alvo

- `web`: Caddy servindo o frontend estatico e proxyando `/api/*`
- `api`: Fastify com `health` e `ready`
- `worker`: processo dedicado para jobs recorrentes
- `postgres`: banco principal
- `redis`: base para fila, locks e rate control futuro

## O que ja foi fechado no repositorio

- `Dockerfile` com targets `api`, `worker` e `web`
- `Caddyfile` para SPA com fallback em `index.html`, proxy via `API_UPSTREAM` e probes locais de `web`
- `docker-compose.yml` com processos separados e healthcheck na API
- `worker.ts` com agenda basica dos jobs internos
- build do frontend preparado para `VITE_API_URL=/api`

## Variaveis de producao

Minimas para a aplicacao:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `PUBLIC_URL`
- `APP_URL`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- `SENTRY_TRACES_SAMPLE_RATE`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`
- `VITE_SENTRY_RELEASE`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT_WEB`
- `MERCADO_PAGO_ENABLED`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_ID`
- `WORKER_REMINDERS_INTERVAL_SECONDS`
- `WORKER_RECONCILE_INTERVAL_SECONDS`
- `WORKER_CLEANUP_INTERVAL_SECONDS`

Overrides uteis para o `docker-compose.yml` local ou no Droplet:

- `DOCKER_DATABASE_URL`
- `DOCKER_REDIS_URL`
- `DOCKER_SMTP_HOST`
- `DOCKER_SMTP_PORT`
- `DOCKER_PUBLIC_URL`
- `DOCKER_APP_URL`
- `DOCKER_CORS_ORIGIN`
- `DOCKER_VITE_API_URL`
- `DOCKER_API_UPSTREAM`
- `CADDY_SITE_ADDRESS`
- `WEB_HTTP_PORT`
- `WEB_HTTPS_PORT`

## Processo recomendado

1. ajustar `.env` de producao com segredos e URLs reais
2. buildar as imagens:

```bash
docker compose build api worker web
```

3. subir infraestrutura base:

```bash
docker compose up -d postgres redis
```

4. rodar migrations:

```bash
docker compose run --rm api corepack pnpm --filter @belezafoco/api prisma:migrate:deploy
```

5. subir aplicacao:

```bash
docker compose up -d api worker web
```

6. validar:

- `GET /health`
- `GET /ready`
- login
- dashboard
- booking publico
- job do worker no log
- webhook de pagamento de teste

## Caddy e dominio

O `Caddyfile` usa `CADDY_SITE_ADDRESS`.

Sugestoes:

- local: `CADDY_SITE_ADDRESS=:80`
- staging: `CADDY_SITE_ADDRESS=staging.seudominio.com`
- producao: `CADDY_SITE_ADDRESS=app.seudominio.com`

Quando usar dominio publico valido, o Caddy pode emitir HTTPS automaticamente.

## Backups

Politica inicial recomendada:

- `pg_dump` diario
- retencao de 7 a 14 dias
- copia off-machine
- restore testado ao menos uma vez por sprint importante

## Rollback

O rollback precisa ser simples:

- manter a imagem anterior de `web`, `api` e `worker`
- manter dump recente do banco
- rodar migrations apenas com plano de reversao
- registrar release do Sentry por deploy

## Validacao ja feita nesta fase

- `docker compose config` validado com sucesso
- `corepack pnpm -r build` validado
- `corepack pnpm -r test` validado
- `worker:start` validado ate o ponto de conexao com banco; sem Postgres ativo, os jobs falham como esperado

## Risco residual

Ainda nao houve:

- `docker compose build` completo com daemon ativo
- `docker compose up` end-to-end
- validacao real de HTTPS e DNS na DigitalOcean
