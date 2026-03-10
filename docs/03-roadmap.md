# Roadmap

Atualizado em: 8 de março de 2026

## Fase 1. Fundação de produção

Status: concluída nesta iteração

- PostgreSQL definido como core
- Schema Prisma refeito para produção
- Migração inicial criada
- Refresh token persistido
- Webhook e booking com idempotência
- `health` e `ready`
- Docker base e compose atualizados

## Fase 2. Onboarding e identidade do negócio

Status: concluída parcialmente nesta iteração

- Workspace com nome, slug, endereço, WhatsApp, branding, texto e políticas
- Horários de funcionamento editáveis
- Checklist visual no dashboard
- Auth + criação de workspace dentro do app shell

Pendências:

- upload real de logo
- wizard em múltiplas etapas com persistência fina
- checklist com tracking mais detalhado

## Fase 3. Agenda operacional

Status: concluída parcialmente nesta iteração

- Agenda com prevenção de conflito
- staff + recurso compartilhado
- segmentos de ocupação
- exceções de staff
- export CSV
- atualização de status

Pendências:

- visualização diária/semanal/mensal completa
- reagendamento rico
- folgas globais e feriados com UI dedicada
- encaixes e bloqueios manuais com interface específica

## Fase 4. Catálogo, equipe e CRM

Status: concluída parcialmente nesta iteração

- cadastro de serviços
- cadastro de equipe
- cadastro de recursos
- listagem de clientes com sinal de recorrência

Pendências:

- pacotes
- add-ons
- serviços combinados
- permissões finas por módulo
- painel individual do profissional

## Fase 5. Booking público premium

Status: concluída nesta iteração

- página pública mobile-first
- escolha de serviço, profissional e horário
- coleta de dados do cliente
- aceitação de política
- feedback de sucesso
- base para sinal Pix

## Fase 6. Comunicação e pagamentos

Status: concluída parcialmente nesta iteração

- abstração de provider
- reminder job com deduplicação
- webhook seguro por segredo compartilhado
- fluxo de reserva com Pix preparado

Pendências:

- adapter real de WhatsApp Cloud API
- adapter real de Mercado Pago
- retry/backoff em fila
- templates mais completos por workspace

## Fase 7. Billing do SaaS

Status: concluída parcialmente nesta iteração

- trial
- planos base
- limites server-side
- endpoint administrativo de assinatura

Pendências:

- tela completa de cobrança no frontend
- cobrança automática do próprio SaaS
- métricas de uso por tenant mais visíveis

## Fase 8. Go-to-market e operação

Status: concluída parcialmente nesta iteração

- landing comercial
- documentação de deploy
- posicionamento comercial

Pendências:

- provas sociais reais
- material de demo
- automação de observabilidade externa
