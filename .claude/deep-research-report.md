# Plano de produção e roadmap para BELEZAFOCO

## Escopo e diagnóstico executivo

Este diagnóstico foi feito em **30 de março de 2026 (America/Sao_Paulo)**, a partir do repositório **Badzx-tec/BELEZAFOCO**, com foco em: arquitetura atual, stack e dependências, módulos/rotas/integrações, riscos e lacunas para produção (segurança, pagamentos, observabilidade, LGPD, CI/CD, testes, backup e escalabilidade) e um roadmap em quatro fases.

O repositório já entrega uma **fundação sólida** para um SaaS B2B de gestão de operação de beleza (multi-tenant), com **monorepo TS** (apps + packages), **Next.js (web público + backoffice)**, **NestJS (API)**, **Prisma/PostgreSQL** e intenção de **Redis/BullMQ** — inclusive com documentação interna bem organizada sobre decisões, arquitetura, testes e deploy. fileciteturn46file0L1-L1 fileciteturn39file0L1-L1 fileciteturn114file0L1-L1

Ao mesmo tempo, o estado atual é claramente de **greenfield em transição de “shell premium” → “wiring real”**: **Auth (email + Google) e sessão** estão bem encaminhados e com testes unitários/e2e mínimos; porém **financeiro, catálogo, booking público, webhooks, worker e integrações** ainda estão majoritariamente **stubados** ou “pendente de wiring real”. fileciteturn43file0L1-L1 fileciteturn35file0L1-L1 fileciteturn36file0L1-L1 fileciteturn63file0L1-L1

Do ponto de vista de “plano de produção”, há três red flags imediatas:

- **Risco de 404/integração quebrada entre Web ↔ API por desalinhamento de rotas/proxy**: a API tem prefixo global `/api/v1` fileciteturn119file0L1-L1 e a doc confirma esse prefixo fileciteturn109file0L1-L1, mas o `web` chama caminhos como `/api/auth/login` fileciteturn71file0L1-L1 e o `next.config.ts` reescreve `/api/*` para `${apiOrigin}/api/*` (sem inserir `/v1`) fileciteturn57file0L1-L1. Isso tende a gerar chamadas para `/api/auth/login` no serviço API, que não existe se o prefixo for `/api/v1`.  
- **Segredos e defaults perigosos para produção**: `.env.example` sugere secrets “change_me…” fileciteturn58file0L1-L1 e o `AuthService` tem fallback para esses valores quando as variáveis não existem fileciteturn27file0L1-L1— o que é aceitável em dev, mas inaceitável em produção.  
- **Webhooks/pagamentos/WhatsApp ainda sem verificação criptográfica e idempotência operacional completa** (há endpoint e documentação, mas está “accepted/pending wiring”). fileciteturn37file0L1-L1 fileciteturn40file0L1-L1

## Auditoria da arquitetura atual do repositório

O projeto segue um **monorepo** com `pnpm-workspace.yaml` indicando `apps/*` e `packages/*`. fileciteturn114file0L1-L1 A raiz usa **Corepack + pnpm** (versão pinada via `packageManager`) e Node `>=22`, com scripts para desenvolvimento paralelo, build, lint/test/typecheck, Playwright E2E e rotinas do Prisma (generate/validate/migrate/seed). fileciteturn115file0L1-L1

A documentação interna define a estrutura e a intenção do “produto”: `apps/web` é o único serviço público; `apps/api` é versionada em `/api/v1`; `apps/worker` é para filas (BullMQ). Também há packages para UI/contratos/tipos e `packages/database` com Prisma schema/seed. fileciteturn39file0L1-L1

Na infra, já existem:

- **Dockerfiles** para `web`, `api` e `worker`, todos em Node 22 bookworm-slim, fazendo install com pnpm, `prisma:generate` e build filtrado por app. fileciteturn60file0L1-L1 fileciteturn61file0L1-L1 fileciteturn62file0L1-L1  
- Config de deploy no **Northflank** (`infra/northflank/services.yaml`) com topologia `web` (público) + `api` (interno) + `worker` (interno), addons Postgres/Redis e jobs de `migrate` e `seed-demo`. fileciteturn59file0L1-L1  
- Um runbook detalhando variáveis esperadas, healthchecks e checklist de rollout no Northflank. fileciteturn55file0L1-L1  

No domínio, o Prisma schema já descreve um **modelo rico** que antecipa o SaaS completo: identidade (`User`, `Session`, credenciais), multi-tenant (`Workspace`, `Membership`, `Role`), agenda/booking (`Service`, `StaffProfile`, `Client`, `Appointment` etc.), financeiro (`Payment`, `Receivable`, `LedgerEntry` etc.), auditoria e notificações. fileciteturn52file0L1-L1 Essa escolha é reforçada pelo documento de modelo de domínio e regras transacionais (“todo agregado transacional carrega `workspaceId`”). fileciteturn51file0L1-L1

## Stack, dependências, módulos, rotas e integrações

A decisão formal de stack é: **TypeScript monorepo com Next.js + NestJS + Prisma + PostgreSQL + Redis + BullMQ + Sentry**, com deploy via Docker/Northflank. fileciteturn46file0L1-L1 Hoje, isso aparece assim no código:

No `apps/web`:

- Next.js `16.1.6` + React `19.2.3`, Tailwind `^4`, UI compartilhada via `@belezafoco/ui` e contratos/tipos via `@belezafoco/sdk` e `@belezafoco/types`. fileciteturn117file0L1-L1  
- Rotas públicas e autenticadas listadas na doc (`/`, `/precos`, `/faq`, `/login`, `/cadastro`, `/verificar-email`, `/redefinir-senha`, `/b/[slug]` e `/app/*`). fileciteturn39file0L1-L1  
- O `AppShell` renderiza navegação de backoffice e controles de sessão/workspace. fileciteturn65file0L1-L1  
- O mecanismo de chamada à API usa `fetch` com `credentials: "include"` e injeta `x-csrf-token` (lido do cookie `bf_csrf_token`) nas mutações. fileciteturn67file0L1-L1  

No `apps/api`:

- NestJS `11.x`, JWT, `cookie-parser`, `google-auth-library`, `nodemailer`, Prisma Client e Postgres via `@prisma/adapter-pg` + `pg`. fileciteturn116file0L1-L1  
- Bootstrap do Nest define `rawBody: true`, `trust proxy = 1`, prefixo global `api/v1`, CORS com `credentials: true` e `ValidationPipe` com whitelist e `forbidNonWhitelisted`. fileciteturn119file0L1-L1  
- Os módulos importados no `AppModule` são muitos (auth, catálogo, financeiro etc.), mas vários ainda são “casca” (ex.: `PaymentsModule`, `FilesModule`, módulos de integração). fileciteturn120file0L1-L1 fileciteturn87file0L1-L1 fileciteturn91file0L1-L1 fileciteturn88file0L1-L1  
- A doc de arquitetura lista como “ativos na fundação”: `health`, `auth`, `me`, `catalog`, `finance`, `public-booking`, `webhooks`. fileciteturn39file0L1-L1  

Rotas no estado atual (observadas no código/Docs):

- **Health**: `/api/v1/health/live` (liveness) e `/api/v1/health/ready` (readiness com query no Postgres; Redis ainda “pending-wiring”). fileciteturn34file0L1-L1  
- **Auth**: endpoints completos de register/login/refresh/logout, reset de senha e verificação de e-mail; e Google OAuth via `credential` do GIS. fileciteturn43file0L1-L1 fileciteturn73file0L1-L1 fileciteturn116file0L1-L1  
- **Sessão e workspace ativo**: `GET /api/v1/me/session` e `POST /api/v1/me/workspaces/select` protegidos por `SessionAuthGuard` e `CsrfGuard`. fileciteturn33file0L1-L1 fileciteturn29file0L1-L1 fileciteturn30file0L1-L1  
- **RBAC** inicial: `RolesGuard` valida `roleCode` via decorator `@Roles(...)`. fileciteturn31file0L1-L1 fileciteturn32file0L1-L1  
- **Catálogo e financeiro (backoffice)**: controllers existem com guards, mas retornam dados “demo” e “accepted/scaffolded” (sem persistência). fileciteturn23file0L1-L1 fileciteturn35file0L1-L1  
- **Booking público**: endpoints existem, mas com payload/slots mockados. fileciteturn36file0L1-L1  
- **Webhooks**: endpoints para Mercado Pago e WhatsApp existem, mas ainda não validam assinatura/origem e só ecoam payload. fileciteturn37file0L1-L1  
- **Email**: `MailService` funciona como adapter: usa SMTP real quando configurado e cai para “preview logado” quando não há provedor. fileciteturn74file0L1-L1  

No `apps/worker`:

- Dependências incluem BullMQ + ioredis + pino, mas o `main.ts` só loga o bootstrap e enumera filas esperadas, sem efetivamente criar `Queue`/`Worker` BullMQ ainda. fileciteturn118file0L1-L1 fileciteturn63file0L1-L1  
- Há intenção explícita de filas para “appointment-reminders”, “payment-reconciliation” e “notification-retries”. fileciteturn63file0L1-L1  

Integrações (estado e intenção):

- **Google OAuth**: já existe no fluxo de auth e é descrito como “real” na doc. fileciteturn43file0L1-L1  
- **Mercado Pago Pix**: a doc prevê idempotência, QR/copia-e-cola e webhook seguro com reconciliação, mas reconhece wiring pendente; código de webhook ainda não valida assinatura. fileciteturn40file0L1-L1 fileciteturn37file0L1-L1  
- **WhatsApp Cloud API**: doc prevê templates, retries via worker e logs em `NotificationLog`; wiring real pendente. fileciteturn40file0L1-L1  
- **S3/objeto**: variáveis AWS estão previstas, mas módulo de Files está vazio no API (ainda). fileciteturn58file0L1-L1 fileciteturn91file0L1-L1  

## Lacunas e riscos para produção

Abaixo, um checklist prático do que está faltando para um **ambiente de produção “vendável”** e depois para **SaaS escalável** — sempre ancorado no que o repo já tem e no que ele promete.

### Problema crítico de roteamento Web ↔ API

Hoje há um provável desalinhamento:

- API responde em `/api/v1/*` (prefixo global). fileciteturn119file0L1-L1  
- Web chama `/api/auth/*`, `/api/me/*` etc. fileciteturn71file0L1-L1 fileciteturn66file0L1-L1  
- Rewrite do Next envia `/api/:path*` para `${apiOrigin}/api/:path*`. fileciteturn57file0L1-L1  

Sem um ajuste, o mais comum é a autenticação falhar por 404.

Correção recomendada (P0):

- Padronizar o contrato em **um** dos modelos:
  - Modelo A: Web usa `/api/v1/...` e rewrite mantém `/api/:path*` → `${apiOrigin}/api/:path*` (ou muda para `/api/v1`).  
  - Modelo B: Web usa `/api/...` e API muda prefixo para `/api` (menos recomendado, porque vocês já documentaram `/api/v1`). fileciteturn109file0L1-L1  
  - Modelo C (mais limpo): rewrite muda para `destination: ${apiOrigin}/:path*` e `source` vira `/api/v1/:path*` (ou mantém `/api/:path*` mas injeta `/api/v1`).  

### Autenticação e gestão de sessão

Pontos positivos prontos ou muito próximos:

- Sessão em cookies same-origin com access token curto + refresh rotativo e CSRF por double-submit cookie está descrita como “estado atual” e aparece no código (cookies `bf_access_token`, `bf_refresh_token`, `bf_csrf_token`, header `x-csrf-token`). fileciteturn43file0L1-L1 fileciteturn73file0L1-L1 fileciteturn28file0L1-L1  
- Há RBAC inicial via `RolesGuard` em superfícies sensíveis (ex.: financeiro). fileciteturn35file0L1-L1 fileciteturn31file0L1-L1  
- Há seed demo com `Role owner`, `WorkspaceSubscription` etc. fileciteturn79file0L1-L1  

O que falta para produção (P0/P1):

- Remover qualquer chance de subir com secrets “change_me…”. Hoje `.env.example` recomenda e o `AuthService` tem fallback. fileciteturn58file0L1-L1 fileciteturn27file0L1-L1  
- Ajustar `SESSION_COOKIE_SECURE` para **true em produção** e garantir que cookies sejam sempre `Secure` (HTTPS) e `HttpOnly` onde aplicável. fileciteturn58file0L1-L1 fileciteturn28file0L1-L1  
- Endurecimento de auth contra brute force: Nest recomenda **rate limiting** (ex.: `@nestjs/throttler`). citeturn9search0  
- Fluxo de “email verificado”: a doc diz “verificação obrigatória de email”; operacionalmente, é importante definir se usuário pode operar sem `emailVerifiedAt` (hoje, o seed marca verificado; e a doc descreve endpoints). fileciteturn43file0L1-L1 fileciteturn79file0L1-L1  

### Pagamentos (Mercado Pago Pix) e faturamento do SaaS

Status: há modelos (`Payment`, `PaymentAttempt`, `WorkspaceSubscription`, `FeatureLimit`) no Prisma schema fileciteturn52file0L1-L1 e uma doc que descreve exatamente como deveria ser o wiring Mercado Pago Pix e webhooks. fileciteturn40file0L1-L1 Porém, `PaymentsModule` ainda está vazio fileciteturn87file0L1-L1 e o webhook atual só devolve “accepted”. fileciteturn37file0L1-L1

Requisitos mínimos para “MVP vendável”:

- Criar pagamento Pix com **idempotência** (`X-Idempotency-Key`). Mercado Pago tornou obrigatório o uso de idempotency key em endpoints de Payments/Refunds para novas integrações em 2024, para reduzir duplicidades. citeturn1search0  
- Validar autenticidade do webhook do Mercado Pago antes de mutar estado. A documentação do Mercado Pago para notificações inclui o header `x-signature` (formato `ts=...,v1=...`) para validação. citeturn2search5  
- Wiring para atualizar `Payment.status`, criar `PaymentAttempt`, reconciliar em `LedgerEntry`/`Receivable` e registrar em `AuditLog` (o schema já suporta trilha). fileciteturn52file0L1-L1 fileciteturn51file0L1-L1  

### Segurança (app, webhooks, secrets, supply chain)

O repo tem um checklist de segurança interno bem alinhado: rotação de segredos, cookies same-origin, CSRF, RBAC, `workspaceId` em agregados, “sem PII em logs”, validação de webhooks e Sentry/audit trail. fileciteturn54file0L1-L1

Para produção, esses itens precisam virar implementação verificável. Recomendações objetivas:

- **Configuração de CORS de produção**: hoje `origin` vira `true` por default quando `CORS_ORIGIN` não existe. fileciteturn119file0L1-L1 Para ambiente com `credentials: true`, o mais seguro é restringir para uma lista explícita de origens.  
- **Rate limiting** para auth e webhooks (NestJS oferece recipe para throttling). citeturn9search0  
- **Validação de webhooks com assinatura + comparação em tempo constante + uso de raw body**. O seu Nest já ativa `rawBody: true`, o que é importante para assinatura baseada no payload bruto. fileciteturn119file0L1-L1 E é recomendado evitar `==` simples e usar comparação segura (ex.: `crypto.timingSafeEqual`) em validação de assinatura. citeturn4search3  
- **Riscos OWASP Top 10** que tendem a aparecer cedo em SaaS B2B: Access Control quebrado, misconfig de segurança, componentes desatualizados e “security logging/monitoring failures” — todos relevantes aqui (RBAC multi-tenant, secrets, dependências e observabilidade). citeturn9search1  
- **Supply chain**: travar versões (já existe pnpm lock), automatizar `audit`/SCA no CI e dependabot (quando criar workflows). fileciteturn115file0L1-L1  

### Observabilidade (logs, tracing, métricas, alertas)

A stack decision cita Sentry como padrão fileciteturn46file0L1-L1, e a infra já prevê `SENTRY_DSN` em env. fileciteturn58file0L1-L1 fileciteturn59file0L1-L1 Mas não há instrumentação no código ainda (e não aparecem dependências `@sentry/*` no repo).  

O mínimo para produção:

- **Sentry no API**: o próprio NestJS tem recipe oficial para integrar `@sentry/nestjs` e um `SentryGlobalFilter` (captura exceptions não tratadas), com inicialização em `instrument.ts`. citeturn5search0  
- **Sentry no Web**: configurar ambientes/releases e amostragem (Next.js guide). citeturn5search5turn5search4  
- **Tracing com OpenTelemetry (OTel)**: Prisma tem documentação oficial para tracing OpenTelemetry, inclusive combinando instrumentação de Prisma + HTTP/Express. citeturn5search2turn5search1  
- **Métricas operacionais**: pelo menos RED (Rate/Errors/Duration) para endpoints críticos (auth, criação de booking, webhook, criação de Pix), e métricas de filas quando BullMQ entrar.  
- **Sem PII em logs**: já está no checklist interno; precisa virar regra de engenharia + revisão de logs. fileciteturn54file0L1-L1  

### LGPD e governança de dados

O schema já inclui campos de consentimento em `Client` (ex.: `communicationConsent`, `whatsappConsent`, `emailConsent`, `marketingConsentAt`). fileciteturn52file0L1-L1 Isso é um bom sinal de maturidade para LGPD, mas LGPD “para produção” envolve processos e endpoints além do schema.

Checklist mínimo (orientativo, não é aconselhamento jurídico):

- **Mapeamento e transparência**: LGPD define princípios como finalidade, necessidade, transparência, segurança e responsabilização. citeturn0search1  
- **Direitos do titular (art. 18)**: garantir capacidade de responder a solicitações (confirmação, acesso, correção, anonimização/bloqueio/eliminação, portabilidade e eliminação quando aplicável). citeturn8search0  
- **Definição de papéis (controlador/operador/encarregado/DPO)**: há guia da ANPD sobre agentes de tratamento e encarregado. citeturn0search3turn8search2  
- **Retenção e descarte**: LGPD prevê eliminação após o término do tratamento e hipóteses legais de conservação (art. 16). citeturn8search0  
- **Registro de operações e segurança**: `AuditLog` existe no schema e já é citado como necessário na doc de auth; ampliar para operações sensíveis (financeiro/pagamentos/exports). fileciteturn51file0L1-L1 fileciteturn52file0L1-L1  

### CI/CD, testes, backup e escalabilidade

O projeto tem uma estratégia de testes descrita (unit, integração, e2e, smoke) e já possui Playwright smoke de páginas principais, além de testes unitários de auth. fileciteturn44file0L1-L1 fileciteturn80file0L1-L1 fileciteturn98file0L1-L1

Faltas para “produção com confiança”:

- **CI em GitHub Actions**: hoje não há workflow `.github/workflows/ci.yml` no repo (404 ao tentar acessar).  
- Recomendação: pipeline com `pnpm install --frozen-lockfile`, `typecheck`, `lint`, `test`, `test:e2e` e build; e cache de deps. O `actions/setup-node` suporta caching (inclusive pnpm), e a documentação de caching de dependências descreve o uso de setup-actions. citeturn6search0turn6search6  
- **Consistência do package manager via Corepack**: o projeto já usa Corepack nos scripts e Dockerfiles; Node tem docs oficiais explicando o papel do Corepack e `corepack enable`. fileciteturn115file0L1-L1 citeturn10search1turn10search3  
- **Migrations em produção**: vocês já têm job `migrate` e usam `prisma migrate deploy` no script. fileciteturn59file0L1-L1 fileciteturn115file0L1-L1 A doc do Prisma descreve `migrate deploy` como comando voltado a staging/prod. citeturn7search0  
- **Backup antes de migração**: Northflank recomenda explicitamente “backup → rodar migração → deploy” em release flows. citeturn7search1turn7search5  
- **Worker real**: quando BullMQ entrar, seguir conceitos de Queue/Worker e conexões Redis; BullMQ documenta o modelo básico de filas. citeturn7search4 fileciteturn118file0L1-L1  

## Arquitetura alvo para produção e escala

A arquitetura-alvo deve preservar o que o repo já aponta (web público + api interna + worker, Postgres, Redis, deploy Northflank) fileciteturn55file0L1-L1 e adicionar camadas de confiabilidade (observabilidade, CI/CD, segurança de webhooks e pagamentos, storage de arquivos, backups).

Um desenho alvo (alto nível):

```mermaid
flowchart LR
  U[Usuário] -->|HTTPS| W[web: Next.js (público + backoffice)]
  W -->|/api/v1/* via rewrite interno| A[api: NestJS]
  A --> P[(PostgreSQL)]
  A --> R[(Redis)]
  A --> S3[(Object Storage / S3 compatível)]
  A --> Obs[(Sentry + OpenTelemetry Collector)]
  WK[worker: BullMQ] --> R
  WK --> P
  WK --> MP[Mercado Pago]
  WK --> WA[WhatsApp Cloud API]
  MP -->|webhooks| A
  WA -->|webhooks| A
```

Como isso se traduz em componentes e contratos:

- **Web**: continua sendo o único serviço público, com rewrite para API interna, mas com contrato de rota **corrigido** (ver P0). fileciteturn39file0L1-L1 fileciteturn57file0L1-L1  
- **API**: continua em `/api/v1`, adicionando: middleware de segurança (rate limiting, hardening), validação completa de webhooks Mercado Pago/WhatsApp, endpoints persistidos para catálogo/agenda/financeiro e interfaces para worker. fileciteturn119file0L1-L1 fileciteturn54file0L1-L1  
- **Worker**: processa reminders, retries e reconciliação Pix com idempotência; hoje é só scaffold. fileciteturn63file0L1-L1  
- **Dados**: manter `workspaceId` como eixo de isolamento (já no schema) e reforçar com “tenant guards” em queries Prisma (P0/P1). fileciteturn52file0L1-L1  
- **Observabilidade**: Sentry (erros/releases) + OTel (tracing), apoiado por docs oficiais de Nest/Sentry e Prisma/OTel. citeturn5search0turn5search2  
- **Release**: CI para build/test; deploy contínuo com Northflank; migrações via job/release flow com backup. fileciteturn59file0L1-L1 citeturn7search1turn7search0  

## Roadmap em quatro fases, backlog priorizado, monetização, lançamento e métricas

Abaixo um roadmap pragmático em quatro fases (como solicitado). Para esforço, usei uma escala simples: **S (1–3 dias)**, **M (1–2 semanas)**, **L (3–6 semanas)**, **XL (6+ semanas)** por um time pequeno (1–3 devs). Ajuste conforme seu time.

### Fase de estabilização técnica

| Campo | Definição |
|---|---|
| Objetivo | Tornar o sistema “implantável e depurável” (sem surpresas de rota, secrets e health), com baseline de segurança, CI mínimo e observabilidade inicial. |
| Entregáveis | Correção do contrato **Web↔API** (P0) alinhando `/api/v1` fileciteturn119file0L1-L1 com rewrites do Next fileciteturn57file0L1-L1 e chamadas do web fileciteturn71file0L1-L1; rotação/remoção de defaults “change_me” (P0) fileciteturn27file0L1-L1 fileciteturn58file0L1-L1; CORS restrito em prod fileciteturn119file0L1-L1; rate limiting em rotas de auth e webhooks (Nest throttler) citeturn9search0; instrumentação Sentry no API (recipe Nest) citeturn5search0; Playwright smoke e unit tests rodando em CI (inicial). fileciteturn98file0L1-L1 fileciteturn80file0L1-L1 |
| Prioridade | **P0** (bloqueia produção e MVP). |
| Esforço | L (principalmente ajustes de contrato, config e pipeline). |
| Stack recomendada | Manter stack do repo: Next/Nest/Prisma/Postgres/Redis; adicionar `@nestjs/throttler` citeturn9search0; `@sentry/nestjs` citeturn5search0; base de OTel (opcional já nesta fase) citeturn5search2. |
| Riscos | Mudança de rotas pode afetar front; secrets mal configurados podem quebrar login; CI pode falhar por dependências de services externos (SMTP/Google). fileciteturn43file0L1-L1 |
| Critérios de aceite | Login/register/refresh/logout funcionando em **staging** com HTTPS e cookies `Secure`; `/health/live` e `/health/ready` ok; smoke Playwright passa; Sentry recebe erro de teste; CI bloqueia merge se typecheck/lint/test falharem. |

### Fase de MVP vendável

| Campo | Definição |
|---|---|
| Objetivo | Entregar um MVP que **cobra e retém**: agenda/booking com sinal Pix e lembretes básicos, com backoffice mínimo e onboarding. |
| Entregáveis | Implementar persistência real de: serviços, profissionais, clientes e agendamentos (substituir stubs do `catalog`/`public-booking`). fileciteturn23file0L1-L1 fileciteturn36file0L1-L1; Pix Mercado Pago end-to-end: criar pagamento com idempotência (`X-Idempotency-Key`) citeturn1search0, armazenar `Payment`/`PaymentAttempt` fileciteturn52file0L1-L1, exibir QR/copia-e-cola no booking e reconciliar via webhook; validar webhook Mercado Pago com `x-signature` conforme doc oficial citeturn2search5; MVP de “reminder” (email pelo menos) usando `NotificationLog` fileciteturn52file0L1-L1 e `MailService` fileciteturn74file0L1-L1; iniciar worker BullMQ para “reminderJobs” (a doc já prevê retries via worker) fileciteturn40file0L1-L1. |
| Prioridade | **P0/P1** (vira receita). |
| Esforço | XL (é a primeira fase de negócio com integrações e persistência). |
| Stack recomendada | Permanecer em Next/Nest/Prisma; BullMQ+Redis de fato citeturn7search4; práticas de webhook seguro (comparação segura, raw body) citeturn4search3. |
| Riscos | Webhooks e pagamentos elevam risco operacional (duplicidade, fraude, replay). O uso de idempotência e validação de assinatura é essencial. citeturn1search0turn2search5 |
| Critérios de aceite | Cliente consegue: criar conta → configurar serviços/profissionais → publicar booking → gerar Pix → receber status “pago” via webhook → booking confirmado; logs/auditoria registram trilha; falhas em webhook não corrompem estado (idempotência + retries). |

### Fase de automações com IA

| Campo | Definição |
|---|---|
| Objetivo | Reduzir carga operacional e aumentar retenção: automações inteligentes (mensagens, confirmação, otimização de agenda, insights financeiros). |
| Entregáveis | “Copiloto” do gestor: sugestões de reagendamento (quando no-show), geração automática de mensagens/roteiros de WhatsApp com base em templates; detecção de risco de no-show (features simples: histórico, horário, antecedência) para ajustar política de sinal; resumo diário com insights (receita prevista, buracos na agenda, comissões). Aproveitar `ReminderJob`, `NotificationLog`, `Payment` e `LedgerEntry` do schema. fileciteturn52file0L1-L1 fileciteturn51file0L1-L1 |
| Prioridade | **P1** (diferenciação e margem). |
| Esforço | L–XL (depende do escopo de IA e qualidade exigida). |
| Stack recomendada | Introduzir “IA” como um módulo isolado: jobs no worker para geração/score; feature flags por plano (`FeatureLimit`, `WorkspaceSubscription`). fileciteturn52file0L1-L1 |
| Riscos | LGPD/privacidade: garantir minimização de dados, logs sem PII e base legal/consentimento para mensagens. citeturn0search1turn8search0 |
| Critérios de aceite | Automação reduz tempo manual mensurável (ex.: lembretes e confirmações); métricas mostram redução de no-show e aumento de pagamento antecipado; controles LGPD e opt-in por canal funcionam. |

### Fase de escala SaaS

| Campo | Definição |
|---|---|
| Objetivo | Escalar operação e comercial sem “explodir” custo: multi-workspace maduro, billing SaaS, observabilidade completa, hardening e automação de deploy. |
| Entregáveis | Billing SaaS (assinaturas, upgrade/downgrade, status `past_due`, limites por plano); dashboards financeiros persistidos (sem mock) conforme doc de finanças fileciteturn53file0L1-L1; worker com DLQ/retries (notification retries, reconciliação) fileciteturn63file0L1-L1; CI/CD completo (build/test + deploy + migração) usando caching via `actions/setup-node` citeturn6search0turn6search6 e release flow no Northflank com backup antes de migração citeturn7search1turn7search5; OTel tracing + Sentry releases (web/api/worker) citeturn5search0turn5search2turn5search4; políticas LGPD: export/portabilidade e ciclo de vida de dados (art. 18 e art. 16). citeturn8search0 |
| Prioridade | **P1/P2** (necessário quando houver tração). |
| Esforço | XL (principalmente billing + operação). |
| Stack recomendada | Manter stack atual; adicionar observabilidade e automação de infra; eventualmente separar “public API” e “internal API” caso cresça. |
| Riscos | Complexidade operacional (suporte, incidentes, finanças), risco de inadimplência e erros de cobrança, maior superfície de ataque. citeturn9search1 |
| Critérios de aceite | Deploy repeatable (CI) + rollback; SLO básico (ex.: 99.9% uptime para `api`); billing auditável; suporte a múltiplos workspaces sem leaks (teste de isolamento tenant). |

### Backlog priorizado

Abaixo um backlog “enxuto”, priorizado para sair do estado atual (shell + auth) e chegar ao MVP vendável e depois IA/escala. (Os itens citam o que já existe no repo como ponto de partida.)

| Prioridade | Item | Fase | Âncora no repo |
|---|---|---|---|
| P0 | Corrigir contrato de rotas Web↔API (`/api/v1` + rewrites + chamadas) | Estabilização | prefixo `/api/v1` fileciteturn119file0L1-L1 + rewrites fileciteturn57file0L1-L1 + chamadas `/api/auth/*` fileciteturn71file0L1-L1 |
| P0 | Eliminar defaults “change_me” e bloquear boot se secrets ausentes em prod | Estabilização | `.env.example` fileciteturn58file0L1-L1 + fallback no AuthService fileciteturn27file0L1-L1 |
| P0 | Rate limiting em auth e webhooks | Estabilização | Nest throttler doc citeturn9search0 |
| P0 | Observabilidade mínima (Sentry API + release tags) | Estabilização | recipe Nest/Sentry citeturn5search0turn5search4 |
| P0 | Validar webhook Mercado Pago (x-signature) antes de processar | MVP | webhook scaffold fileciteturn37file0L1-L1 + doc MP citeturn2search5 |
| P0 | Pagamento Pix: criar payment com idempotência e persistir `Payment/Attempt` | MVP | schema `Payment/Attempt` fileciteturn52file0L1-L1 + MP idempotency citeturn1search0 |
| P0 | Persistir catálogo/agenda (substituir mocks) | MVP | `catalog.controller` com mocks fileciteturn23file0L1-L1 |
| P1 | Worker BullMQ real: reminders + retries + reconciliação | MVP | worker scaffold fileciteturn63file0L1-L1 + BullMQ guide citeturn7search4 |
| P1 | Financeiro persistido e consultas agregadas | Escala SaaS | pendências doc de finanças fileciteturn53file0L1-L1 |
| P1 | CI/CD com GitHub Actions e caching pnpm | Escala SaaS | actions/setup-node citeturn6search0turn6search6 |
| P1 | LGPD: export/portabilidade + deleção/anonimização + política de retenção | Escala SaaS | direitos art. 18 citeturn8search0 + modelo já tem consentimentos fileciteturn52file0L1-L1 |
| P2 | IA: score de no-show, mensagens inteligentes por template, resumo diário | IA | schema `NotificationLog`, `Appointment`, `Payment` fileciteturn52file0L1-L1 |

### Modelo de monetização proposto

O schema e tipos já sugerem planos (`starter`, `growth`, `scale`) e uma entidade `WorkspaceSubscription`. fileciteturn93file0L1-L1 fileciteturn52file0L1-L1 Uma proposta alinhada:

- **Trial**: 14 dias (ou até X agendamentos), sem exigir cartão, mas exigindo verificação de e-mail (já existe fluxo). fileciteturn43file0L1-L1  
- **Starter** (solo / 1–2 profissionais): agenda + CRM + booking público, lembretes por email, Pix como add-on.  
- **Growth** (equipe): tudo do Starter + WhatsApp Cloud, Pix nativo, financeiro básico (recebíveis/caixa), permissões por papel (RBAC já existe). fileciteturn31file0L1-L1  
- **Scale** (multi-unidade / operação maior): limites maiores (staff, serviços, mensagens), relatórios, auditoria avançada, integrações, APIs e SLAs.

Add-ons (boa alavanca de margem):

- Pacotes de mensagens WhatsApp (cobrança por volume) e/ou “template premium”.
- Módulo IA (score de no-show, otimização de horários, follow-ups automáticos) habilitado via `FeatureLimit`. fileciteturn52file0L1-L1  
- Armazenamento de arquivos (logos/documentos) quando `FilesModule` e S3 entrarem. fileciteturn91file0L1-L1  

### Plano de lançamento

Um plano de lançamento consistente com o que já existe no repo (Northflank + jobs migrate/seed + smokes Playwright) fileciteturn59file0L1-L1 fileciteturn98file0L1-L1:

- **Pré-lançamento (staging)**: corrigir roteamento, ligar Sentry e garantir que `/health/live` e `/health/ready` estejam OK. fileciteturn34file0L1-L1  
- **Beta fechado** (5–10 salões): operar com Pix e lembretes, medir no-show e conversão do booking; suporte manual (mas auditável).  
- **Go-live (produção)**: usar fluxo recomendado de migração (backup → migrate → deploy), conforme guias do Northflank citeturn7search1turn7search5 e manter `seed-demo` apenas em ambiente não-prod (ou protegido). fileciteturn59file0L1-L1  
- **Pós-lançamento (30 dias)**: correção rápida de bugs com releases rastreáveis (Sentry release/environment). citeturn5search4turn5search5  

### Métricas de produto recomendadas

Para BELEZAFOCO (agenda + Pix + WhatsApp + financeiro), as métricas “núcleo” devem refletir ativação, retenção e valor entregue:

- **Ativação**: % de workspaces que completam onboarding e criam (1) serviço, (2) profissional, (3) 1º booking público em até 7 dias. (A UI de onboarding existe; wiring ainda precisa). fileciteturn39file0L1-L1  
- **Conversão do booking**: visitas em `/b/[slug]` → preenchimento → booking criado → pagamento Pix gerado → Pix pago. (Hoje a página é estática; fase MVP deve medir). fileciteturn103file0L1-L1  
- **No-show rate**: % de appointments com status `no_show` versus total; objetivo é reduzir com reminders e sinal Pix (o schema já modela `AppointmentStatus` e `pending_payment`). fileciteturn52file0L1-L1  
- **Receita e inadimplência**: `paidAt`, `expired`, `past_due` (para SaaS), reconciliação automática de pagamentos, assertividade do ledger. fileciteturn52file0L1-L1  
- **Retenção**: WAU/MAU de workspaces, número de agendamentos por week, churn de assinatura (quando billing entrar). fileciteturn52file0L1-L1  
- **Qualidade operacional**: taxa de falha de webhook (validação/assinatura), latência p95 de endpoints críticos, falhas de job no worker, incidência de erros capturados no Sentry. citeturn5search0turn5search4turn4search3  

Essas métricas também viram critérios de aceite para as fases de MVP/escala.

---

Este plano está alinhado ao que já está documentado e parcialmente implementado no BELEZAFOCO (stack, arquitetura, checklist de segurança, estratégia de testes e deploy). fileciteturn46file0L1-L1 fileciteturn39file0L1-L1 fileciteturn54file0L1-L1 fileciteturn44file0L1-L1 fileciteturn55file0L1-L1