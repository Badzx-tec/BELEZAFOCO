# Decisões de Arquitetura

Data base: 2026-03-10

## ADR-001: O core transacional permanece em Fastify + Prisma + PostgreSQL

Status: adotado

Motivo:

- a base atual já suporta agenda, multi-tenant, audit log e pagamentos
- o problema não é stack errada; é hardening de produção
- migrar o core para Convex, MongoDB ou outro backend atrasaria entrega comercial sem benefício proporcional

## ADR-002: `Workspace` continua sendo o tenant canônico

Status: adotado

Diretriz:

- toda operação autenticada precisa resolver `workspaceId` no servidor
- membership continua sendo a fonte de verdade para RBAC
- ownership checks por workspace devem existir em todo lookup por ID

## ADR-003: Convex foi rejeitado como core

Status: adotado

Decisão:

- não usar Convex no core transacional

Motivo:

- o MCP do Convex retornou ambiente não autorizado
- não há caso de uso de tempo real que justifique mais uma superfície operacional agora
- se houver uso futuro, será complementar, por exemplo feed operacional ou presença

## ADR-004: Idempotência agora é namespaced por escopo e tenant

Status: adotado

Decisão:

- `IdempotencyKey` passa a usar `namespaceKey = scope:workspace:key`

Motivo:

- `key` única global era frágil e permitia colisão transversal
- o booking público precisava rejeitar replays com payload divergente

## ADR-005: `DIRECT_URL` é obrigatório para o caminho de produção

Status: adotado

Decisão:

- `DATABASE_URL` fica para runtime
- `DIRECT_URL` fica para migrations e operações CLI

Motivo:

- a documentação atual do Prisma recomenda conexão direta para `migrate deploy`, especialmente em ambientes com pooler/PgBouncer
- Northflank e addons PostgreSQL pedem clareza entre runtime e migração

## ADR-006: Mercado Pago segue por adapter HTTP sem SDK adicional

Status: adotado

Decisão:

- integração inicial usa `fetch` nativo contra `https://api.mercadopago.com/v1/payments`

Motivo:

- mantém o runtime simples
- evita acoplamento prematuro a um SDK sem necessidade
- facilita log e troubleshooting do payload real

## ADR-007: Webhook do Mercado Pago deve ser validado e reconciliado

Status: adotado

Diretriz:

- validar assinatura HMAC quando `MP_WEBHOOK_SECRET` existir
- tratar payload oficial e consultar detalhes do pagamento por API
- manter compatibilidade com payload mock para ambiente local

## ADR-008: Sentry permanece como padrão de observabilidade

Status: adotado

Diretriz:

- backend com `@sentry/node` e integração Prisma
- frontend com `@sentry/react` e tracing de rotas
- DSNs entram por ambiente, nunca em arquivo versionado

## ADR-009: Playwright continua padrão de E2E

Status: adotado

Motivo:

- cobre melhor os fluxos críticos pedidos: login, onboarding, agenda, booking público e pagamentos
- nesta sessão o MCP de browser encontrou limitação ambiental, mas a escolha do repositório não muda

## ADR-010: A direção visual premium será construída sobre shadcn + tokens locais

Status: adotado

Diretriz:

- usar primitives e padrões do ecossistema shadcn como base
- manter tokens locais em Tailwind/CSS variables
- não depender de hotlinks frágeis para assets finais

## ADR-011: `demo-beleza` Ã© um slug reservado para demo comercial e smoke tests

Status: adotado

Diretriz:

- `demo-beleza` pode responder com payload sintÃ©tico controlado quando `PUBLIC_DEMO_ENABLED=true`
- o fallback existe apenas para demonstraÃ§Ã£o comercial, QA visual e smoke no Northflank
- slugs reais continuam presos ao banco e ao fluxo transacional normal

Motivo:

- o ambiente publicado no Northflank pode subir sem seed demo, quebrando a vitrine comercial
- o produto precisa continuar demonstrÃ¡vel mesmo quando o banco de staging estÃ¡ vazio ou indisponÃ­vel
- o fallback nÃ£o interfere em tenants reais porque estÃ¡ restrito a um slug reservado
