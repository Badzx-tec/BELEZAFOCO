# Changelog

## 2026-03-10

### Hardening transacional e caminho de produção

- `IdempotencyKey` passou a usar `namespaceKey` único por `scope + workspace + key`
- helper de idempotência agora rejeita replay com payload divergente
- booking público passou a reutilizar resposta persistida e a serializar `payment` sem expor payload bruto do provider
- provider do Mercado Pago passou a suportar criação real de Pix via API oficial quando habilitado
- webhook do Mercado Pago passou a aceitar payload oficial, validar assinatura HMAC e consultar o pagamento na API do provider
- `schema.prisma` recebeu `directUrl` e o wrapper do Prisma passou a fazer fallback de `DIRECT_URL`
- `.env.example` e `northflank.env.example` ganharam `DIRECT_URL` e `API_BASE_URL`
- testes unitários adicionados para namespace de idempotência e assinatura/status do Mercado Pago
- docs criados/atualizados: auditoria técnica, ADRs, Northflank deploy, security checklist, design system, MCP usage log e trilha inicial do financeiro

### Deploy e staging

- `Caddyfile` ajustado para usar `API_UPSTREAM` configuravel, deixando o `web` pronto para Compose e Northflank
- `web` passou a expor probes locais em `/healthz` e `/readyz` para plataformas de deploy
- `.env.example` e `docker-compose.yml` alinhados ao novo upstream configuravel
- guia de deploy em Northflank adicionado em `docs/09-deploy-northflank.md`

### Auditoria e operacao

- auditoria tecnica e ADRs reescritas para refletir o estado real validado nesta execucao
- backlog operacional criado no Linear em `BELEZAFOCO Production Launch` com epicos `THA-5` a `THA-10`
- PRD curto e runbook operacional criados no Notion
- log de uso dos MCPs criado em `docs/08-mcp-usage-log.md`
- estrategia de testes criada em `docs/07-testing-strategy.md`

### Booking engine

- `AppointmentSegment` evoluido para suportar `resourceUnit`
- migration adicionada para permitir capacidade real de recurso por horario
- alocacao de recurso agora considera unidades disponiveis em toda a janela ocupada do atendimento
- conflitos de booking agora usam transacao `Serializable` com retry para `P2034`
- testes unitarios adicionados para capacidade de recurso

### Runtime e ambiente local

- `@fastify/sensible` atualizado para major compativel com Fastify 5
- fallback do frontend para `API_URL` passou a inferir o host atual em dev/preview
- `CORS_ORIGIN` default ampliado para cobrir `localhost` e `127.0.0.1` em `5173` e `4173`
- `.env.example` alinhado ao novo fallback local e aos projetos reais do Sentry
- validacao no navegador confirmou que o erro de CORS foi resolvido; o bloqueio restante passou a ser banco local indisponivel

## 2026-03-09

### Hardening da fase 1

- bootstrap de ambiente do Prisma endurecido com carregamento da `.env` raiz para `generate`, `migrate` e `seed`
- fluxo de refresh token corrigido no backend para validar o token de refresh explicitamente, sem depender do request atual
- validacoes de ownership multi-tenant reforcadas em servicos, equipe e fila de espera
- artefatos `.js` residuais removidos de `apps/web/src/components`, evitando que o Vite sombreasse os `.tsx`
- camada HTTP do frontend ajustada para tratar falha de rede, expirar sessao com seguranca e propagar mensagens melhores
- acessibilidade do auth, dashboard e booking publico revisada com `label`, `fieldset`, `id/name`, `required` e feedback via `role=\"alert\"`
- warnings do React Router removidos com `future` flags e UX do booking revalidada no navegador

### Observabilidade

- Sentry configurado na API com release, environment, traces sampler e captura segura de erros 5xx por request
- Prisma preparado para tracing no cliente v5 com `previewFeatures = [\"tracing\"]`
- frontend React integrado ao Sentry com tracing do React Router v6, error boundary e sincronizacao de usuario/workspace
- build do Vite preparado para release tracking e upload opcional de sourcemaps via `@sentry/vite-plugin`
- `.env.example`, checklist e guia de deploy atualizados com as variaveis operacionais do Sentry

### Infra e worker

- `worker.ts` criado com agenda recorrente para reminders, cleanup e reconciliacao, evitando sobreposicao de execucao
- jobs de reminders, cleanup e pagamentos refatorados para funcoes reutilizaveis e execucao isolada
- `Dockerfile` refeito com targets `api`, `worker` e `web`
- `docker-compose.yml` refeito para stack com `postgres`, `redis`, `api`, `worker` e `web`
- `Caddyfile` refeito para SPA estatico com proxy de `/api/*` para a API
- `.dockerignore` criado e `.env.example` ampliado com overrides especificos de Docker

### Frontend core

- `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers` e `zod` adicionados ao frontend
- `QueryClientProvider` criado com politica basica de retry/cache para a camada HTTP
- auth migrado para React Hook Form + Zod + mutation assíncrona
- booking publico migrado para React Hook Form + Zod + queries de workspace/slots + mutation de reserva
- primitives `Input`, `TextArea` e `Select` convertidos para `forwardRef` para compatibilidade com RHF

### Auditoria e documentacao

- auditoria tecnica reescrita com base em leitura do repositorio, validacao de build/teste, Chrome DevTools e pesquisa web atual
- decisoes arquiteturais formalizadas para manter Fastify + Prisma + PostgreSQL + React e profissionalizar a base
- checklist de producao criado em `docs/03-production-checklist.md`
- guia inicial de deploy alvo na DigitalOcean criado em `docs/04-deploy-digitalocean.md`
- estrategia de integracoes reais para WhatsApp Cloud API e Mercado Pago criada em `docs/05-integrations-whatsapp-mercadopago.md`
- posicionamento comercial refeito em `docs/06-sales-positioning.md`
- README alinhado aos documentos exigidos nesta fase

## 2026-03-08

### Arquitetura

- auditoria tecnica criada em `docs/01-technical-audit.md`
- decisao arquitetural formalizada para manter Fastify/Prisma/React e migrar o core para PostgreSQL

### Backend

- `schema.prisma` refeito para producao com PostgreSQL
- migracao inicial gerada em `apps/api/prisma/migrations/20260308154000_production_foundation`
- refresh token persistido e revogavel
- middleware de tenant reforcado
- dashboard multi-tenant com checklist e metricas
- booking publico com idempotencia
- segmentos de agenda para prevencao de conflito
- webhook de pagamento endurecido
- jobs de reminders, reconciliacao e cleanup atualizados

### Frontend

- landing comercial nova
- cockpit autenticado com onboarding e operacao
- booking publico premium em etapas
- design system minimo com componentes reutilizaveis
- identidade visual refeita

### Operacao

- `.env.example` atualizado
- `docker-compose.yml` atualizado com PostgreSQL, Redis e Mailhog
- `Dockerfile` atualizado para build do monorepo
- documentacao de deploy, roadmap e posicionamento comercial criada

### Testes e build

- build do backend validado
- testes do backend validados
- build do frontend validado
- teste utilitario inicial do frontend validado

### Demo e staging

- `demo-beleza` virou slug reservado de demo e smoke com fallback sintÃ©tico controlado para Northflank e QA visual
- `.env.example` e `northflank.env.example` ganharam `PUBLIC_DEMO_ENABLED`
