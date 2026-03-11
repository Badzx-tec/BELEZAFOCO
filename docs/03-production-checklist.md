# Checklist de Producao

Data base: 2026-03-10

## Infra e ambiente

- [ ] separar variaveis por ambiente: local, staging e producao
- [ ] guardar segredos fora do repositorio
- [x] corrigir bootstrap Prisma para funcionar sem gambiarra de cwd
- [x] usar `DIRECT_URL` para Prisma CLI e `DATABASE_URL` para runtime
- [x] combined service alinhado ao deploy real do Northflank
- [ ] definir dominio final, HTTPS e estrategia de certificados

## Banco e dados

- [x] schema principal em PostgreSQL
- [x] migration baseline versionada
- [x] seed comercial padronizada em `demo-beleza`
- [ ] validar backup automatico e restore testado
- [ ] revisar ownership checks restantes em todos os FKs recebidos por ID

## Backend

- [x] `health`, `healthz`, `ready` e `readyz`
- [x] jobs separados para reminders e reconciliacao
- [x] webhook do Mercado Pago validado e reconciliado
- [x] provider real do WhatsApp Cloud API
- [x] webhook do Meta persistido em `WebhookEvent`
- [ ] retries controlados para envio e reconciliacao
- [ ] logs estruturados por request, webhook e job

## Frontend e demo

- [x] landing premium e auth premium presentes no branch publicado
- [x] SPA servida pelo Fastify no deploy combinado
- [x] fallback `demo-beleza` restaurado para smoke e demo comercial
- [ ] onboarding guiado em etapas
- [ ] dashboard operacional com agenda real

## Integracoes

- [x] Mercado Pago Pix real com `X-Idempotency-Key`
- [x] webhook Mercado Pago com consulta do pagamento oficial
- [x] WhatsApp Cloud API real com templates aprovados por `MessageTemplate`
- [x] fallback opcional por email
- [ ] fila e rate control para notificacoes

## Observabilidade e seguranca

- [x] Sentry na API
- [x] Sentry no frontend
- [x] release tracking e source maps preparados no build do frontend
- [ ] auditoria de acoes criticas cobrindo billing, agenda e configuracoes
- [ ] revisao de politicas de consentimento e LGPD minima

## Go-live comercial

- [x] demo seed padrao: `demo-beleza`
- [ ] landing final com pricing, nichos, FAQ e CTA de demo
- [ ] documentacao de deploy validada com rollout completo no Northflank
- [ ] processo de rollback documentado e exercitado
- [ ] rotina de suporte inicial documentada
