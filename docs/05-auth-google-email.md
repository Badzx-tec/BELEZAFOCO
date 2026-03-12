# 05. Auth Google Email

## Auth por email
- Registro com nome do negocio, nome do responsavel, email, senha e telefone opcional.
- Login por email e senha.
- Reset de senha por token.
- Verificacao obrigatoria de email.
- Sessao same-origin com access token curto e refresh token rotativo.

## Google OAuth
- Frontend recebe `credential` do Google Identity Services.
- Backend recebe a credencial por HTTPS.
- Backend deve validar assinatura, `aud`, `iss`, `exp` e usar `sub` como identificador estavel.
- Vinculacao por email verificado.
- Origem do botao Google limitada a origens autorizadas.
- CSRF por double-submit cookie quando o fluxo exigir.

## Auditoria
- Login, logout, refresh, reset e vinculacao de conta devem gerar `AuditLog`.
- Sessao deve registrar `ipAddress`, `userAgent` e `workspaceId` quando houver.

## Estado atual
- `POST /api/v1/auth/register` agora cria `User`, `Workspace`, `Membership`, `PasswordCredential` e `Session` no mesmo corte.
- `POST /api/v1/auth/login` valida hash com `bcryptjs` e emite cookies same-origin.
- `POST /api/v1/auth/google` agora valida o ID token com `google-auth-library`, checa `iss`, `aud`, `email_verified`, origem permitida e CSRF por double-submit cookie.
- O fluxo Google faz login de contas ja vinculadas, vincula contas existentes por email verificado e cria workspace owner quando o intent e `register`.
- `POST /api/v1/auth/refresh` faz rotacao real de `accessTokenId`, `refreshTokenId` e `csrfSecret` na tabela `Session`.
- `POST /api/v1/auth/logout` revoga a sessao ativa e limpa os cookies `bf_access_token`, `bf_refresh_token` e `bf_csrf_token`.
- `GET /api/v1/me/session` agora resolve sessao real a partir do access token e retorna workspaces ativos do usuario.
- `POST /api/v1/me/workspaces/select` troca o workspace ativo e rotaciona access token + CSRF.
- mutacoes autenticadas agora exigem `x-csrf-token` coerente com o cookie `bf_csrf_token` e com o `csrfSecret` persistido na sessao.
- controladores internos passaram a exigir `SessionAuthGuard`, com `RolesGuard` aplicado aos cortes financeiros e de cadastro operacional sensivel.
- o shell autenticado do `web` agora resolve sessao em runtime, redireciona visitantes sem sessao para `/login`, permite troca de workspace e expõe logout seguro.
- `POST /api/v1/auth/request-password-reset`, `POST /api/v1/auth/reset-password`, `POST /api/v1/auth/resend-verification` e `POST /api/v1/auth/verify-email` usam action tokens assinados; em `development`, a API devolve preview do token e da URL para acelerar QA.
- `MailService` com `nodemailer` entrou como adapter isolado: envia SMTP real quando `SMTP_HOST`/`SMTP_USER` estao configurados e cai para preview logado quando o ambiente ainda esta sem provedor.
- `AuditLog` ja registra `auth.register`, `auth.login`, `auth.password_reset_requested`, `auth.password_reset_completed`, `auth.email_verified` e `auth.workspace_selected` quando ha `workspaceId` disponivel.
- O frontend publico de `/login`, `/cadastro`, `/redefinir-senha` e `/verificar-email` agora consome a API real e exibe feedback de sucesso/erro sem perder a composicao premium.
- O seed demo agora gera hash real para `SEED_ADMIN_PASSWORD` e marca o admin demo como `emailVerifiedAt` preenchido.
- WhatsApp Cloud API e Mercado Pago Pix seguem para as proximas fatias.
