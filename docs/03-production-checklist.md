# Checklist de Producao

Data base: 2026-03-10

## Infra e ambiente

- [ ] separar variaveis por ambiente: local, staging e producao
- [ ] guardar segredos fora do repositorio
- [x] corrigir bootstrap Prisma para funcionar sem gambiarra de cwd
- [x] separar artefatos de `web`, `api` e `worker` para deploy
- [ ] definir dominio, HTTPS e estrategia de certificados
- [ ] definir volumes persistentes para banco e logs

## Banco e dados

- [x] schema principal em PostgreSQL
- [x] migracao versionada inicial criada
- [x] revisar ownership checks em servicos, equipe e fila de espera
- [x] revisar modelagem de `Resource.capacity`
- [ ] revisar ownership checks restantes em todos os FKs recebidos por ID
- [ ] revisar contadores mensais de plano e reconciliacao de uso
- [ ] validar backup automatico e restore testado
- [ ] fechar compatibilidade da toolchain com Prisma MCP / Prisma 7

## Backend

- [x] `health` e `ready` existentes
- [x] Zod em boa parte das entradas
- [x] corrigir refresh token e rotacao de sessao
- [x] jobs separados em processo de worker
- [x] corrigir runtime da API para Fastify 5 com plugin compativel
- [ ] mover logica de negocio para services/repositories/policies
- [ ] aplicar rate limit especifico em rotas sensiveis
- [ ] endurecer tratamento padrao de erro
- [ ] adicionar testes de API, auth, webhook e multi-tenant
- [ ] adicionar lint real e formatacao automatica

## Agenda e regras de negocio

- [x] prevencao basica de conflito por segmentos
- [x] capacidade de recurso compartilhado implementada corretamente no core transacional
- [ ] agenda diaria, semanal e mensal real
- [ ] bloqueios manuais, folgas e excecoes com UX propria
- [ ] reagendamento robusto
- [ ] no-show, cancelamento e politica de taxa fechados de ponta a ponta

## Frontend

- [x] landing, shell e booking publico existentes
- [x] remover artefatos `.js` de dentro de `apps/web/src`
- [x] corrigir paridade local entre `localhost` e `127.0.0.1` para preview/dev
- [ ] adotar TanStack Query
- [ ] adotar React Hook Form + Zod
- [x] melhorar acessibilidade basica de formularios
- [x] melhorar estados de erro e loading
- [ ] implementar onboarding guiado em etapas
- [ ] implementar dashboard operacional com agenda real

## Integracoes

- [ ] Mercado Pago Pix real com sandbox e producao
- [ ] webhook Mercado Pago com validacao de assinatura e reconciliacao
- [ ] WhatsApp Cloud API real com templates aprovados
- [ ] webhook Meta validado e persistido
- [ ] retries controlados para envio e reconciliacao
- [ ] fallback opcional por email

## Billing do proprio SaaS

- [ ] revisar planos para Fundador Solo, Equipe Pequena e Pro
- [ ] enforcement server-side por plano
- [ ] tela de upgrade e status de assinatura
- [ ] telemetria de uso por workspace

## Observabilidade e seguranca

- [x] Sentry na API
- [x] Sentry no frontend
- [x] release tracking e source maps preparados no build do frontend
- [ ] logs estruturados por request, webhook e job
- [ ] auditoria de acoes criticas cobrindo billing, agenda e configuracoes
- [ ] revisao de politicas de consentimento e LGPD minima

## Go-live comercial

- [ ] landing final com pricing, nichos, FAQ e CTA de demo
- [ ] demo seed bonita
- [ ] documentacao de deploy validada com `docker compose up` completo
- [ ] processo de rollback documentado
- [ ] rotina de suporte inicial documentada
