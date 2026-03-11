# Auditoria Técnica do BELEZAFOCO

Data: 2026-03-10

## Resumo executivo

O repositório já parte de uma base correta para um SaaS de agenda no nicho de beleza: monorepo `pnpm`, backend em Fastify + Prisma + PostgreSQL, frontend React + Vite, multi-tenant com `Workspace`, booking público, billing inicial, audit log, health checks e worker separado.

O projeto ainda não está em nível de produção comercial. O principal gap encontrado nesta etapa foi a fundação transacional: a tabela de idempotência era global por `key`, sem namespacing por escopo/tenant, e o fluxo público de booking não protegia adequadamente replays com payload divergente. Em paralelo, o caminho de deploy precisava separar `DATABASE_URL` e `DIRECT_URL` para runtime e migrations.

## O que foi auditado

- árvore local e espelho remoto via GitHub MCP
- `schema.prisma`, migrations e toolchain Prisma
- Dockerfile, envs e caminho de deploy
- rotas de booking, payments, webhooks e tenant enforcement
- docs oficiais atuais via Context7 e web
- backlog e documentação viva via Linear e Notion
- disponibilidade de Sentry, shadcn, Figma, TestSprite, Convex, Chrome DevTools e Playwright MCPs

## Estado atual confirmado

### Base saudável

- `apps/api` e `apps/web` estão bem separados
- `schema.prisma` já está em PostgreSQL e cobre workspaces, memberships, agenda, pagamentos, mensagens, waitlist e auditoria
- `worker.ts` já separa reminders, reconciliação e cleanup
- Sentry já está integrado em backend e frontend
- build da API e testes atuais passam

### Bloqueios reais para produção

1. Idempotência frágil
   - `IdempotencyKey.key` era única globalmente
   - não havia namespacing por `scope + workspace`
   - um replay com payload diferente podia reutilizar a mesma chave

2. Caminho de migrations incompleto para produção
   - o runtime usava `DATABASE_URL`, mas o deploy ainda não documentava `DIRECT_URL`
   - sem separar conexão pooled e conexão direta, o caminho com PgBouncer/Northflank ficava frágil

3. Mercado Pago incompleto
   - criação de Pix estava em modo mock/placeholder
   - webhook aceitava apenas payload simplificado
   - assinatura oficial e consulta posterior do pagamento ainda não estavam materializadas

4. Tooling Prisma heterogêneo
   - projeto local em Prisma `5.22`
   - Prisma MCP da sessão em `7.x`, incompatível com o formato atual de datasource
   - isso impacta inspeção via MCP, não o app em si

5. Banco local indisponível para migrations
   - `prisma generate`, build e testes passaram
   - `prisma migrate deploy` não pôde ser validado localmente porque o banco não estava acessível para novos processos CLI

## Correção estrutural entregue nesta etapa

### Idempotência endurecida

- `IdempotencyKey` agora usa `namespaceKey` único
- o namespace é `scope:workspaceId:key` com fallback `global`
- o helper agora detecta conflito quando a mesma chave volta com `requestHash` diferente
- o booking público passou a preferir replay persistido e a rejeitar reuso indevido

### Booking público endurecido

- a resposta persistida de replay agora inclui `payment` serializado quando houver Pix
- o fluxo evita expor `rawPayload` do provider para o cliente público
- o booking guarda a resposta final somente depois de concluir a criação do Pix

### Fundamento de deploy Prisma/Northflank

- `datasource` recebeu `directUrl`
- o wrapper `prisma-with-env.mjs` faz fallback de `DIRECT_URL` para `DATABASE_URL`
- `.env.example` e `northflank.env.example` foram atualizados com `DIRECT_URL` e `API_BASE_URL`

### Mercado Pago mais próximo do real

- o provider agora cria Pix real via `POST /v1/payments` quando `MERCADO_PAGO_ENABLED=true`
- o webhook aceita payload oficial, verifica assinatura HMAC e busca detalhes do pagamento na API do Mercado Pago
- o modo mock legado foi mantido para ambiente local e testes

## Validação desta etapa

- `corepack pnpm --filter @belezafoco/api prisma:generate`: aprovado
- `corepack pnpm --filter @belezafoco/api build`: aprovado
- `corepack pnpm --filter @belezafoco/api test`: aprovado
- novas suites:
  - `apps/api/tests/idempotency.test.ts`
  - `apps/api/tests/mercadopago-provider.test.ts`

## Riscos remanescentes

- `prisma migrate deploy` segue sem validação ponta a ponta nesta máquina por indisponibilidade do banco para novos processos
- o frontend não pôde ser validado em servidor persistente nesta sessão, então Chrome DevTools/Playwright ficaram limitados pelo ambiente
- WhatsApp Cloud API continua sem integração real
- módulo financeiro ainda precisa de modelagem de ledger, comissões, AP/AR e UX própria

## Próximos passos recomendados

1. Aplicar a migration nova em um PostgreSQL acessível e validar `_prisma_migrations`.
2. Subir o frontend em um preview estável e executar smoke/E2E com Playwright.
3. Evoluir o design system com shadcn para dashboard, agenda, financeiro e onboarding.
4. Implementar o módulo financeiro com ledger auditável.
5. Fechar WhatsApp Cloud API com templates, logs e retries.
