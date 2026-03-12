# 03. Architecture

## Estrutura
- `apps/web`: marketing, auth, booking publico e backoffice.
- `apps/api`: API NestJS versionada em `/api/v1`.
- `apps/worker`: worker BullMQ.
- `packages/ui`: tokens e componentes compartilhados.
- `packages/sdk`: ponto de entrada para cliente e contratos.
- `packages/types`: tipos compartilhados.
- `packages/database`: Prisma schema, config, seed e client.
- `infra/docker` e `infra/northflank`: deploy e runtime.

## Web
- O `web` e o unico servico publico.
- Rewrites de `/api/:path*` para a API interna.
- Rotas publicas:
  - `/`
  - `/precos`
  - `/faq`
  - `/login`
  - `/cadastro`
  - `/verificar-email`
  - `/redefinir-senha`
  - `/b/[slug]`
- Rotas autenticadas:
  - `/app`
  - `/app/onboarding`
  - `/app/agenda`
  - `/app/clientes`
  - `/app/financeiro`
  - `/app/configuracoes`
  - `/app/faturamento`

## API
- Prefixo global: `/api/v1`.
- Modulos ativos na fundacao:
  - `health`
  - `auth`
  - `me`
  - `catalog`
  - `finance`
  - `public-booking`
  - `webhooks`
- Modulos explicitados para expansao:
  - `users`
  - `workspaces`
  - `memberships`
  - `services`
  - `staff`
  - `clients`
  - `appointments`
  - `availability`
  - `reminders`
  - `payments`
  - `billing`
  - `reports`
  - `audit`
  - `files`
  - `settings`
  - `integrations/google`
  - `integrations/whatsapp`
  - `integrations/mercadopago`
