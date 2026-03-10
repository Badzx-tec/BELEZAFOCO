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

## Estado atual

Validado nesta execucao:

- `corepack pnpm -r test`: aprovado
- `corepack pnpm -r build`: aprovado
- novo teste de capacidade de recurso adicionado e aprovado
- validacao manual via Chrome DevTools identificou e confirmou correcoes de CORS/local preview

Limitacoes observadas:

- o banco nao esta acessivel em `localhost:5432`, impedindo testes de fluxo real com dados
- o MCP de Playwright nao esta disponivel nesta sessao
- o fluxo do TestSprite ficou parcialmente bloqueado por artefatos temporarios ausentes no workspace (`testsprite_tests/tmp`)

## Pilares de teste

## 1. Unitarios e regras puras

Ferramenta: Vitest

Cobrir:

- scheduler
- calculo de deposito
- alocacao de `resourceUnit`
- enforcement de plano
- funcoes de idempotencia e dedupe

Status:

- parcialmente coberto

## 2. Integracao de API

Ferramenta alvo:

- Vitest + Fastify inject
- banco Postgres de teste

Cobrir:

- `auth/register`, `auth/login`, `auth/refresh`, `auth/logout`
- rotas de workspace, service, staff, resource e appointments
- ownership checks por `workspaceId`
- webhooks de Mercado Pago com idempotencia
- erros de permissao por role

Status:

- ainda nao implementado

## 3. E2E de produto

Ferramenta alvo:

- Playwright no repositorio

Fluxos obrigatorios:

1. registro e primeiro login
2. onboarding basico do workspace
3. cadastro de servico, profissional e recurso
4. booking publico com sucesso
5. conflito de agenda
6. expiracao/refresh de sessao
7. pagamento Pix e atualizacao de status

Observacao:

- como o MCP de Playwright nao existe nesta sessao, a validacao de navegador desta rodada foi feita com Chrome DevTools

## 4. Smoke de infraestrutura

Cobrir:

- `GET /health`
- `GET /ready`
- subida de `api`, `worker` e `web`
- conexao com banco
- seed inicial

Status:

- `health` validado
- `ready` depende de banco acessivel

## Matriz de prioridade

## Prioridade P0

- auth e refresh token
- multi-tenant leakage
- booking com conflito
- webhook de pagamento
- capacidade de recurso

## Prioridade P1

- onboarding do negocio
- dashboard do dia
- waitlist
- billing por plano

## Prioridade P2

- landing page
- FAQ
- copy comercial
- provas sociais e CTAs

## Proximos testes a implementar no codigo

1. teste de API para `auth/refresh` com rotacao de refresh token
2. teste de API para bloquear `serviceIds` e `resourceIds` cross-tenant
3. teste de integracao para `createAppointment` com recurso de capacidade 2
4. teste de API para webhook Mercado Pago duplicado
5. suite Playwright para registro, onboarding e booking publico

## Comandos de referencia

```bash
corepack pnpm -r test
corepack pnpm -r build
corepack pnpm --filter @belezafoco/api prisma:generate
```
