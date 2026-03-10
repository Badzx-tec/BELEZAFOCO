# Roadmap

## Status atual

- Auditoria tecnica: concluida
- Decisao arquitetural: concluida
- Baseline de producao: entregue parcialmente
- Frontend comercial e booking publico: entregues parcialmente

## Fase 1

Objetivo: tirar o projeto do modo MVP.

- PostgreSQL como banco principal
- migrations reais
- envs e docker atualizados
- seed operacional utilizavel
- auth, RBAC e webhook endurecidos

Status atual:

- modelagem Prisma migrada para PostgreSQL
- migration baseline adicionada
- `docker-compose` atualizado com PostgreSQL
- refresh token, RBAC, webhook e scheduler fortalecidos

## Fase 2

Objetivo: entregar fluxo comercial e onboarding reais.

- landing page com copy de venda
- booking publico premium
- identidade visual por workspace
- onboarding guiado

Status atual:

- landing page refeita
- dashboard operacional com app shell profissional
- booking publico mobile-first conectado a API

## Fase 3

Objetivo: operacao diaria confiavel.

- agenda por profissional
- excecoes, bloqueios e feriados
- conflitos robustos
- dashboard e relatorios uteis

## Fase 4

Objetivo: retencao e monetizacao.

- lembretes mais maduros
- templates por workspace
- billing do SaaS completo
- experiencia de trial e upgrade

## Fase 5

Objetivo: escalar com seguranca.

- filas e retry mais robustos
- observabilidade e alertas
- politicas de backup/restore testadas
- preparacao para multiunidade e integracoes adicionais
