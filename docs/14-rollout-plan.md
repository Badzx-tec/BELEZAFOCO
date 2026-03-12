# 14. Rollout Plan

## Fase 1
- fundacao do monorepo
- schema Prisma
- landing, auth, cockpit e booking shells
- contratos iniciais da API

## Fase 2
- wiring real de auth por email
- Google OAuth real
- seed demo premium
- worker com reminders e reconciliacao

## Fase 3
- WhatsApp Cloud API
- Mercado Pago Pix
- financeiro persistido
- auditoria e relatorios

## Fase 4
- Playwright smoke
- TestSprite matrix
- Sentry releases
- validacao visual via `chrome-devtools`

## Fase 5
- Dockerfiles finais
- northflank config
- migration job
- seed job
- rollout para URL temporaria

## Go live
- rotacao de segredos
- smoke de producao
- monitoramento de erros e webhooks
- liberacao do dominio final
