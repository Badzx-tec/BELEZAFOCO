# Estrategia de Testes do BELEZAFOCO

Data base: 2026-03-10

## Objetivo

Criar uma malha de qualidade que proteja os fluxos que realmente quebram negocio:

- login e sessao
- isolamento multi-tenant
- disponibilidade e conflito de agenda
- booking publico
- sinal Pix e webhooks
- notificacoes e lembretes

## Validado nesta rodada

- `corepack pnpm -r build`
- `corepack pnpm -r test`
- teste do provider do WhatsApp Cloud API cobrindo payload, telefone normalizado e componentes do template
- teste da assinatura do webhook do Meta (`X-Hub-Signature-256`)
- teste do provider do Mercado Pago atualizado para validar `API_BASE_URL` como origem do webhook
- testes utilitarios de demo publica continuam cobrindo `demo-beleza`

## Limitacoes observadas

- o banco nao esta acessivel em `localhost:5432`, impedindo testes de fluxo real com dados
- o fluxo do TestSprite ficou parcialmente bloqueado por artefatos temporarios ausentes no workspace

## Pilares

### 1. Unitarios e regras puras

Ferramenta: Vitest

Cobrir:

- scheduler
- calculo de deposito
- enforcement de plano
- providers externos
- assinatura de webhooks

### 2. Integracao de API

Ferramenta alvo:

- Vitest + Fastify inject
- banco Postgres de teste

Cobrir:

- auth/register, login, refresh e logout
- rotas de workspace, service, staff, resource e appointments
- ownership checks por `workspaceId`
- webhooks de Mercado Pago e WhatsApp

### 3. E2E de produto

Ferramenta alvo:

- Playwright no repositorio

Fluxos obrigatorios:

1. registro e primeiro login
2. onboarding basico do workspace
3. booking publico com sucesso
4. booking `demo-beleza`
5. conflito de agenda
6. pagamento Pix e atualizacao de status

### 4. Smoke de infraestrutura

Cobrir:

- `GET /healthz`
- `GET /readyz`
- subida do combined service
- seed inicial
- smoke comercial em `/public/b/demo-beleza`
