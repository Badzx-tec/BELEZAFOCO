# 01. Greenfield Audit

## Contexto
- Novo greenfield em `C:\Users\JUAN\Documents\belezaFOCO1`.
- Legado em `C:\Users\JUAN\Documents\BELEZAFOCO` usado apenas como referencia semantica.
- Alvo de deploy: Northflank.

## O que foi aproveitado do legado
- Regras de negocio para agenda, booking, Pix, WhatsApp e demo.
- Nomes de variaveis de ambiente.
- SVGs premium de marketing, booking, finance e nichos.
- Projeto e drafts aprovados do Superdesign.

## O que foi descartado
- Base Fastify/Vite antiga.
- Codigo acoplado ao legado.
- Qualquer dependencia de arquitetura nao relacional.

## Achados criticos
- `env.txt` contem segredos reais em texto puro.
- GitHub MCP autenticado, mas sem permissao para criar novo repo remoto.
- `chrome-devtools` bloqueado nesta sessao por conflito de profile.
- Convex MCP sem autorizacao; nao entra no core.

## Estado do greenfield
- Monorepo criado com `apps`, `packages`, `infra`, `docs`, `scripts`.
- `apps/web` com landing, auth, cockpit, agenda, clientes, financeiro, faturamento e booking publico.
- `apps/api` com prefixo `/api/v1`, health, auth, session, catalog, finance, public booking e webhooks.
- `packages/database` com schema Prisma completo e client gerado.
- Build do workspace concluindo com sucesso.
