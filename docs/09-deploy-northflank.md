# Deploy no Northflank

Data base: 2026-03-10

Este documento deixa o projeto pronto para um ambiente de testes no Northflank com a topologia:

- `belezafoco-postgres`: PostgreSQL gerenciado
- `belezafoco-redis`: Redis gerenciado
- `belezafoco-api`: service usando `Dockerfile` target `api`
- `belezafoco-worker`: service usando `Dockerfile` target `worker`
- `belezafoco-web`: service usando `Dockerfile` target `web`

O repositório foi ajustado para esse cenário:

- o `web` agora aceita `API_UPSTREAM` configuravel no `Caddyfile`
- o `web` expõe probes locais em `/healthz` e `/readyz`
- existe um template de variaveis em `northflank.env.example`

## Estado desta sessao

O deploy automatico nao foi concluido nesta execucao porque a sessao do navegador em `https://app.northflank.com` nao estava autenticada. O repositório ficou preparado para subir assim que a autenticacao estiver disponivel.

## Estrategia recomendada

Para ambiente de testes, use `api` publica e `web` publica.

Isso simplifica a primeira subida:

- `web` consome `VITE_API_URL=https://<api-public-url>`
- `api` aceita `CORS_ORIGIN=https://<web-public-url>`
- `worker` compartilha o mesmo `DATABASE_URL` e `REDIS_URL` da API

Em fase posterior, voce pode migrar para single-origin com `VITE_API_URL=/api` e `API_UPSTREAM=<host-interno-da-api>`, mas isso nao e necessario para o primeiro staging.

## Servico `belezafoco-api`

Configuracao:

- tipo: service
- contexto do build: raiz do repositorio
- `Dockerfile`: `Dockerfile`
- target: `api`
- porta: `3333`

Health checks:

- liveness: `GET /health`
- readiness: `GET /ready`

Variaveis minimas:

- `NODE_ENV=production`
- `PORT=3333`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN=https://<web-public-url>`
- `PUBLIC_URL=https://<web-public-url>`
- `APP_URL=https://<web-public-url>`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT=staging`
- `SENTRY_RELEASE=<git-sha-ou-tag>`
- `SENTRY_TRACES_SAMPLE_RATE=0.2`
- `MERCADO_PAGO_ENABLED=false` no primeiro staging
- `MP_WEBHOOK_SECRET`
- `WHATSAPP_PROVIDER=mock` no primeiro staging

Comando padrao:

- manter o `CMD` do `Dockerfile`

## Servico `belezafoco-worker`

Configuracao:

- tipo: service
- contexto do build: raiz do repositorio
- `Dockerfile`: `Dockerfile`
- target: `worker`

Variaveis:

- copiar as mesmas variaveis da API
- manter `PORT` opcional
- ajustar apenas o que for especifico de job

Observacao:

- esse servico nao precisa ser publico

## Servico `belezafoco-web`

Configuracao:

- tipo: service
- contexto do build: raiz do repositorio
- `Dockerfile`: `Dockerfile`
- target: `web`
- porta: `80`

Health checks:

- liveness: `GET /healthz`
- readiness: `GET /readyz`

Build args minimos:

- `VITE_API_URL=https://<api-public-url>`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT=staging`
- `VITE_SENTRY_RELEASE=<git-sha-ou-tag>`
- `VITE_SENTRY_TRACES_SAMPLE_RATE=0.2`
- `SENTRY_AUTH_TOKEN` se quiser upload de sourcemaps
- `SENTRY_ORG=thark-s4`
- `SENTRY_PROJECT_WEB=belezafoco-web`
- `SENTRY_RELEASE=<git-sha-ou-tag>`

Runtime vars:

- `CADDY_SITE_ADDRESS=:80`
- `API_UPSTREAM=api:3333` apenas se optar por proxy interno em vez de `VITE_API_URL` absoluto

## Banco e Redis

Crie dois addons gerenciados:

- PostgreSQL 16
- Redis 7

Passe as connection strings geradas pelo Northflank para:

- `DATABASE_URL`
- `REDIS_URL`

## Migrations

Antes de liberar o `web`, rode as migrations no ambiente remoto.

Opcao recomendada:

- criar um job ou release job usando o mesmo `Dockerfile` target `api`
- executar:

```bash
corepack pnpm --filter @belezafoco/api prisma:migrate:deploy
```

Seed opcional para demo:

```bash
corepack pnpm --filter @belezafoco/api seed
```

## Ordem de subida

1. criar PostgreSQL e Redis
2. subir `belezafoco-api`
3. rodar `prisma:migrate:deploy`
4. rodar `seed` se quiser staging com demo
5. subir `belezafoco-worker`
6. subir `belezafoco-web`
7. ajustar `CORS_ORIGIN`, `PUBLIC_URL`, `APP_URL` e `VITE_API_URL` com as URLs reais geradas

## Smoke test de staging

Validacoes minimas apos o deploy:

- `GET https://<api-public-url>/health`
- `GET https://<api-public-url>/ready`
- `GET https://<web-public-url>/healthz`
- abrir landing
- abrir booking publico
- autenticar owner seed
- abrir dashboard
- criar servico
- criar agendamento
- validar job do worker nos logs

## Variaveis recomendadas para o primeiro staging

Backend:

- `WHATSAPP_PROVIDER=mock`
- `MERCADO_PAGO_ENABLED=false`
- `SENTRY_ENVIRONMENT=staging`

Frontend:

- `VITE_SENTRY_ENVIRONMENT=staging`

Isso reduz ruido operacional enquanto o objetivo ainda e teste funcional e demo.

## Rollback

Northflank facilita rollback por deploy anterior, mas a regra aqui continua simples:

- nunca promover sem migration validada
- manter `SENTRY_RELEASE` por deploy
- preservar dump do banco antes de qualquer migration destrutiva

## Notas finais

- o `Dockerfile` atual ja suporta targets independentes para `api`, `worker` e `web`
- o `docker-compose.yml` continua sendo a referencia local
- o Northflank nao precisa subir o `docker-compose.yml`; cada service deve apontar para o mesmo `Dockerfile` com target proprio
