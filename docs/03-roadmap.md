# Roadmap

## Status atual

- Auditoria técnica: concluída
- Decisão arquitetural: concluída
- Baseline de produção: entregue parcialmente
- Frontend comercial e booking público: entregues parcialmente

## Fase 1

Objetivo: tirar o projeto do modo MVP.

- PostgreSQL como banco principal
- migrations reais
- envs e docker atualizados
- seed de demo utilizável
- auth, RBAC e webhook endurecidos

Status atual:

- modelagem Prisma migrada para PostgreSQL
- migration baseline adicionada
- `docker-compose` atualizado com PostgreSQL
- refresh token, RBAC, webhook e scheduler fortalecidos

## Fase 2

Objetivo: entregar demo comercial forte.

- landing page com copy de venda
- booking público premium
- identidade visual por workspace
- onboarding guiado

Status atual:

- landing page refeita
- dashboard demo com app shell profissional
- booking público mobile-first conectado à API

## Fase 3

Objetivo: operação diária confiável.

- agenda por profissional
- exceções, bloqueios e feriados
- conflitos robustos
- dashboard e relatórios úteis

## Fase 4

Objetivo: retenção e monetização.

- lembretes mais maduros
- templates por workspace
- billing do SaaS completo
- experiência de trial e upgrade

## Fase 5

Objetivo: escalar com segurança.

- filas e retry mais robustos
- observabilidade e alertas
- políticas de backup/restore testadas
- preparação para multiunidade e integrações adicionais
