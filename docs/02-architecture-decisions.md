# Decisoes de Arquitetura do BELEZAFOCO

Data base: 2026-03-10

Este documento registra as decisoes arquiteturais confirmadas nesta execucao apos auditoria, validacao de docs atuais e teste real no navegador.

## ADR-001: O core permanece em Fastify + Prisma + PostgreSQL

Status: adotado

Decisao:

- manter o core transacional em Node.js + Fastify + Prisma + PostgreSQL

Motivo:

- o dominio exige consistencia forte para agenda, pagamento, RBAC e multi-tenant
- a base atual ja esta suficientemente madura para endurecimento incremental
- reescrever agora atrasaria venda, demo e onboarding sem ganho tecnico proporcional

## ADR-002: Multi-tenant continua baseado em `Workspace`

Status: adotado

Decisao:

- o tenant canonico continua sendo `Workspace`
- o acesso continua mediado por `Membership`

Diretrizes:

- toda query de dominio deve receber `workspaceId`
- toda entrada por ID externo precisa validar ownership dentro do workspace
- autorizacao continua server-side por role e contexto do tenant

## ADR-003: Convex esta rejeitado para o ciclo atual

Status: adotado

Decisao:

- nao usar Convex neste ciclo de producao

Motivo:

- o MCP do Convex retornou ambiente nao autorizado e sem projeto conectado
- nao existe caso de uso de realtime que compense adicionar mais uma fronteira operacional agora
- o core atual ainda tem backlog mais importante em agenda, integracoes e qualidade

Observacao:

- Convex pode voltar a ser avaliado no futuro para feed interno, notificacoes operacionais ou presence, sempre fora do core transacional

## ADR-004: Booking usa transacao serializable com retry

Status: adotado

Decisao:

- operacoes criticas de criacao de agendamento devem usar transacao `Serializable` com retry em `P2034`

Motivo:

- a documentacao atual do Prisma recomenda esse padrao para conflitos de escrita em workloads concorrentes
- booking e capacidade de recurso sao parte do coracao comercial do produto

Implementado nesta rodada:

- `createAppointment` agora usa `Prisma.TransactionIsolationLevel.Serializable`
- retries foram adicionados para conflito de transacao

## ADR-005: Capacidade de recurso e modelada por unidade alocavel

Status: adotado

Decisao:

- `AppointmentSegment` passa a registrar `resourceUnit`
- a unicidade de recurso deixa de ser apenas `resourceId + startsAt` e passa a considerar a unidade

Motivo:

- o schema prometia `Resource.capacity`, mas a implementacao antiga transformava qualquer recurso em capacidade 1
- isso gera recusa indevida de horarios e reduz aderencia ao negocio real

Implementado nesta rodada:

- migration para `resourceUnit`
- helper puro para alocacao e bloqueio por exaustao de capacidade
- testes unitarios cobrindo alocacao e bloqueio

## ADR-006: Frontend deve inferir a origem da API em ambiente local

Status: adotado

Decisao:

- quando `VITE_API_URL` nao estiver definido, o frontend deve inferir `hostname:3333` a partir da origem atual

Motivo:

- a validacao real com Chrome DevTools mostrou quebra entre `127.0.0.1` e `localhost`
- esse tipo de friccao atrapalha demo, QA e onboarding de dev

Implementado nesta rodada:

- fallback do cliente HTTP baseado em `window.location`
- defaults de CORS ampliados para `localhost` e `127.0.0.1` em `5173` e `4173`

## ADR-007: Observabilidade real segue com Sentry

Status: adotado

Decisao:

- manter Sentry como padrao de observabilidade para API e web

Estado atual:

- organizacao encontrada: `thark-s4`
- regiao: `https://de.sentry.io`
- projeto criado: `belezafoco-api`
- projeto criado: `belezafoco-web`

Diretriz:

- DSNs reais entram por ambiente, nao em arquivo versionado

## ADR-008: Playwright continua padrao de E2E, mesmo sem MCP disponivel

Status: adotado

Decisao:

- a suite E2E oficial do repositorio deve ser Playwright

Motivo:

- o pedido do produto exige cobertura de login, onboarding, agenda, booking publico e pagamento
- esta sessao nao expõe MCP de Playwright, mas isso nao muda o padrao tecnico escolhido para o repositorio

## ADR-009: Modernizacao para Prisma 7 fica adiada

Status: adiado

Decisao:

- nao migrar para Prisma 7 nesta rodada

Motivo:

- o app esta estavel em Prisma 5.22
- o Prisma MCP revelou incompatibilidade de tooling, mas a migracao de major precisa ser planejada para nao contaminar backlog funcional

Proximo passo:

- avaliar `prisma.config.ts`, novo formato de datasource e compatibilidade de client em um ciclo dedicado de infraestrutura
