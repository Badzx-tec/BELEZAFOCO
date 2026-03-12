# Changelog

## 2026-03-12
- publicado o greenfield no GitHub em `Badzx-tec/BELEZAFOCO` no commit `0c638c4`
- alinhadas as branches remotas `main` e `deploy/northflank-premium-launch` com o snapshot greenfield
- tentado o deploy no Northflank, mas o painel permaneceu inacessivel por falta de sessao/token local; o host legado ainda respondeu no endpoint `/health`
- adicionados `CsrfGuard` e `RolesGuard` para endurecer mutacoes autenticadas e acessos sensiveis do backoffice
- `refresh` e `logout` agora validam `x-csrf-token` contra o `csrfSecret` persistido na sessao
- o shell autenticado do `web` passou a resolver sessao em runtime, trocar workspace ativo e encerrar sessao pelo frontend
- importado `AuthModule` nos modulos internos que passaram a depender de guards de auth
- implementada auth real no `apps/api` com `AuthService`, `PrismaService`, cookies same-origin e refresh token rotativo
- conectados os endpoints `register`, `login`, `refresh`, `logout`, `request-password-reset`, `reset-password`, `resend-verification`, `verify-email`, `me/session` e `me/workspaces/select`
- adicionada guarda de sessao para rotas autenticadas do `me`
- habilitado `cookie-parser` e `trust proxy` no bootstrap do Nest
- atualizado o readiness check para validar Prisma de verdade
- migrado o runtime Prisma para o modo suportado no v7 com `@prisma/adapter-pg` + `pg`
- corrigido o seed demo para gerar hash real de senha e verificar o admin demo
- adicionados testes unitarios de auth no `api`
- substituido o e2e legado do Nest por smoke real de liveness
- reexecutados smokes do frontend com Playwright sem regressao
- integrado Google OAuth real no backend com `google-auth-library`, validacao de origem e double-submit cookie
- criado o adapter `MailService` com `nodemailer` para verificacao de e-mail e reset de senha
- conectadas as paginas publicas de `/login`, `/cadastro`, `/redefinir-senha` e `/verificar-email` ao backend real

## 2026-03-11
- criado o monorepo greenfield BELEZAFOCO 2.0
- configurados `apps/web`, `apps/api`, `apps/worker` e `packages/*`
- modelado o schema Prisma completo para auth, agenda, CRM, financeiro, auditoria e assets
- implementada a fundacao da landing premium, auth pages, cockpit, agenda, clientes, financeiro, faturamento e booking publico
- substituido o scaffold da API por modulos Nest com contratos iniciais de auth, me, finance, public booking, webhooks e health
- validado `prisma:validate`
- gerado Prisma Client
- validado `typecheck`
- validado `build`
- criado `playwright.config.ts` e smoke tests E2E
- executados 3 smoke tests Playwright com sucesso
- criado o projeto Linear `BELEZAFOCO 2.0 Greenfield` e o backlog inicial `THA-19` a `THA-24`
- atualizadas as paginas do Notion para PRD e runbook
