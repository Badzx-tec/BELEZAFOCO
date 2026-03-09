# Auditoria técnica do BELEZAFOCO

## 1. Resumo executivo

O repositório já tem uma base funcional melhor do que um MVP de tela: existe monorepo, backend em Fastify com Prisma, autenticação JWT, multi-tenant por workspace, catálogo de serviços, equipe, recursos, pagamentos, lembretes, waitlist, billing do próprio SaaS e testes unitários iniciais. Isso muda a decisão arquitetural de forma objetiva.

A melhor decisão técnica e de negócio neste momento é **preservar o stack atual e profissionalizá-lo**, não reescrever do zero. A reescrita para Django + React + MongoDB aumentaria o prazo de entrega, o risco de regressão e o custo de estabilização sem oferecer vantagem estrutural clara para o domínio principal do produto.

## 2. Auditoria do repositório atual

### Estrutura atual

- `apps/api`: Node 20 + TypeScript + Fastify + Prisma + Zod
- `apps/web`: React + Vite + Tailwind
- `packages/shared`: tipos compartilhados mínimos
- `scripts`: backup/restore ainda focados em SQLite

### O que já existe de valor

- Multi-tenant por `Workspace` + `Membership`
- Papéis básicos (`owner`, `manager`, `staff`, `receptionist`)
- Link público por slug
- Serviços com duração, buffers e política de sinal
- Profissionais, recursos e disponibilidade
- Scheduler inicial com prevenção parcial de conflitos
- Waitlist
- Abstração de lembretes e pagamento
- Billing do SaaS com planos e enforcement inicial
- Audit log
- `healthcheck`, rate limiting e logs

### Qualidade atual por camada

#### Backend

- Positivo:
  - Fastify enxuto e rápido
  - Prisma já modela bem o núcleo transacional
  - Uso de Zod nas entradas
  - Organização por módulos
- Fragilidades:
  - SQLite ainda no core
  - ausência de migrations reais versionadas
  - refresh token não está implementado de forma completa
  - RBAC ainda implícito, não padronizado
  - criação pública de agendamento sem proteção robusta contra conflito por sobreposição real
  - webhook sem validação forte de segredo/idempotência
  - pouca separação entre rota e regra de domínio

#### Frontend

- Positivo:
  - base React + Vite + Tailwind simples de evoluir
  - rotas já separadas para landing, app e booking público
- Fragilidades:
  - UI ainda muito rasa e com cara de protótipo
  - sem design system mínimo
  - sem estados de loading/skeleton/erro/sucesso maduros
  - sem fluxo de onboarding real
  - sem dashboard operacional convincente
  - booking público ainda usa campos técnicos em vez de UX de mercado

#### Banco e dados

- Positivo:
  - modelagem central já conversa com agenda multiempresa
  - relacionamentos principais já existem
- Fragilidades:
  - SQLite é gargalo para concorrência, locking e produção multiempresa
  - faltam índices e constraints mais orientados a produção
  - faltam estruturas para idempotência, bloqueios e branding

#### Infra e produção

- Positivo:
  - já existe `Dockerfile`, `docker-compose`, `Caddyfile` e guia de deploy
- Fragilidades:
  - stack atual de deploy ainda assume SQLite
  - frontend não está empacotado como produto de produção
  - backup/restauração focados no banco MVP
  - readiness/checks transacionais ainda ausentes

## 3. O que já está bom

- Monorepo simples, pequeno e fácil de operar
- Escolha de Fastify + Prisma + React é adequada para SaaS B2B local
- Multi-tenant por workspace já está no caminho correto
- Core de agenda, recursos, lembretes e billing já existe
- O sistema já nasceu com noção de SaaS, não apenas agenda single-tenant

## 4. O que ainda é apenas MVP

- Frontend inteiro, especialmente landing, dashboard e booking público
- Seed pouco útil para demo comercial
- Cobertura de testes restrita ao essencial
- Pagamentos e comunicação ainda com provedores mock/placeholder
- Fluxos de onboarding e implantação ainda superficiais

## 5. O que impede produção real hoje

- Banco SQLite no core transacional
- Ausência de migrations versionadas
- conflito de agenda validado de forma insuficiente em criação pública
- webhook de pagamento sem hardening suficiente
- ausência de idempotência para fluxos críticos
- falta de refresh token com persistência/rotação sólida
- falta de padrão explícito de autorização por módulo
- frontend ainda não transmite confiança comercial
- documentação de produção ainda presa ao baseline MVP

## 6. Comparação honesta de arquitetura

### Opção A: evoluir o stack atual

**Stack:** Node/Fastify + Prisma + React + Tailwind + PostgreSQL

#### Vantagens

- menor tempo real de entrega
- aproveita código já escrito e testado
- menor risco de regressão
- Prisma continua produtivo para modelagem multi-tenant
- Fastify é excelente para APIs rápidas, webhooks e serviços de agenda
- reduz custo de troca total de stack e retrabalho de front/back

#### Desvantagens

- exige refatorar partes do backend para separar melhor domínio e rota
- exige migração de SQLite para PostgreSQL
- ainda demanda elevar padrão de frontend e operação

### Opção B: reescrever para Django + React + MongoDB

#### Vantagens

- Django traz admin pronto e ecossistema maduro
- poderia acelerar alguns backoffices se o projeto estivesse muito cru

#### Desvantagens

- reescrita total agora destrói momentum
- migrar regras já existentes aumenta risco funcional
- MongoDB **não é a melhor escolha para o core transacional** de agenda, pagamentos, billing e concorrência
- perderíamos o benefício do Prisma já alinhado ao domínio atual
- o maior problema do projeto não é framework; é profundidade de produto e prontidão de produção

### MongoDB como banco principal

Não é recomendado para o core deste produto. Agenda, cobrança, sinal, conciliação, limites por plano e consistência multi-tenant pedem **transações, constraints, unicidade e consultas relacionais previsíveis**. PostgreSQL é objetivamente melhor para esse núcleo.

## 7. Decisão arquitetural final

### Decisão

**Manter o stack atual e evoluir para uma baseline de produção com PostgreSQL como banco principal.**

### Decisão complementar

- manter Fastify
- manter Prisma
- manter React + Vite + Tailwind
- adotar arquitetura por domínio mais explícita
- manter multi-tenant por linha com `workspaceId` no curto prazo
- preparar caminho para locks transacionais e isolamento mais forte por tenant conforme a base crescer

## 8. Motivos técnicos e de negócio

### Técnicos

- o domínio atual já está modelado no Prisma
- o problema crítico é robustez operacional, não inadequação do stack
- PostgreSQL resolve o gargalo central de produção sem reescrever a aplicação
- Fastify continua excelente para webhooks, alta concorrência moderada e APIs rápidas

### De negócio

- o objetivo é vender rápido e implantar rápido
- preservar a base atual reduz tempo até demo comercial utilizável
- investir em UX, onboarding, agenda pública e confiabilidade gera retorno mais rápido do que trocar framework
- o mercado local compra produto que resolve agenda, faltas, cobrança e operação diária; não compra reescrita

## 9. Referências de mercado usadas para orientar produto

As referências atuais mais úteis para o posicionamento e UX do produto foram:

- Fresha: marketplace + booking 24/7 + lembretes + depósitos + waitlist
- Vagaro: booking online, depósitos, branded app e notificações automáticas
- GlossGenius: booking muito rápido, depósitos, rebooking, CRM e proteção contra no-show
- Booksy: self-booking, rebooking em poucos cliques, reminders e no-show protection
- Trinks: foco local em beleza com WhatsApp, Google/Instagram, comissões e agenda online
- AgendaPro: histórico/prontuário, agenda integrada e controle operacional para estética

Essas referências reforçam um padrão de mercado claro:

- agendamento público simples
- operação mobile-first
- lembretes automáticos
- proteção contra falta/no-show
- branding do negócio
- rebooking e retenção
- integração com Google/redes sociais/WhatsApp

## 10. Roadmap por fases

### Fase 1: baseline de produção

- migrar para PostgreSQL
- criar migrations reais
- endurecer auth, RBAC, webhook e scheduler
- atualizar seed e documentação

### Fase 2: produto vendável

- landing page comercial premium
- booking público premium e mobile-first
- onboarding com identidade do negócio
- dashboard operacional útil

### Fase 3: operação diária

- agenda robusta por profissional
- bloqueios, folgas, feriados e exceções
- CRM leve
- métricas e relatórios úteis

### Fase 4: monetização e retenção

- billing do SaaS mais completo
- pagamentos/sinal mais maduros
- templates e comunicação por workspace
- upgrades de retenção e rebooking

### Fase 5: escala

- filas e jobs mais robustos
- observabilidade aprofundada
- isolamento forte por tenant conforme crescimento
- integrações adicionais e multiunidade
