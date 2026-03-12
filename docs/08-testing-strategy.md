# 08. Testing Strategy

## Camadas
- Unitarios para regras de agenda, auth, comissao, pricing e normalizacao de payloads.
- Integracao para auth, tenant isolation, booking, ledger, pagamentos e webhooks.
- E2E para landing, auth, onboarding, agenda, booking publico, financeiro e permissoes.
- Smoke para deploy e health checks.

## Ferramentas
- TypeScript typecheck em todo o workspace.
- `prisma:validate` e `prisma:generate`.
- Build completo do monorepo.
- Playwright para smoke e fluxos criticos.
- TestSprite para matriz e priorizacao de regressao.

## Estado atual
- `corepack pnpm prisma:validate` passando.
- `corepack pnpm --filter @belezafoco/api test` passando com 3 testes unitarios de auth.
- `corepack pnpm --filter @belezafoco/api test:e2e` passando com smoke real do endpoint de liveness.
- `corepack pnpm typecheck` passando.
- `corepack pnpm build` passando.
- Playwright smoke passando para landing, booking publico e cockpit.
- O corte atual nao adicionou E2E browser para auth porque o `playwright.config.ts` ainda sobe apenas o `web`; para fluxos completos de login/cadastro sera preciso subir `web + api` no mesmo harness.

## Risco conhecido
- `chrome-devtools` nao validou telas nesta sessao por bloqueio de profile.
- Fluxos reais de Google OAuth, SMTP, WhatsApp Cloud e Mercado Pago ainda nao entraram na malha automatizada.
