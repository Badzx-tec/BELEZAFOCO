# Changelog

## 2026-03-09

- documentada a auditoria tecnica do repositorio
- definida a arquitetura alvo preservando Fastify + Prisma + React e migrando o core para PostgreSQL
- migrado o schema Prisma para PostgreSQL com migration baseline versionada
- adicionados onboarding/workspace reforcado, calendario com bloqueios e dashboard summary no backend
- adicionados refresh token persistido, RBAC explicito, webhook idempotente e booking publico com lock transacional
- atualizado seed para demo comercial com servicos, equipe, agenda, bloqueio e pagamento pendente
- refeitas landing page, dashboard e pagina publica de agendamento com UX premium em pt-BR
- atualizados `README`, `DEPLOY_DIGITALOCEAN.md`, `docker-compose.yml` e scripts de backup/restore PostgreSQL
- removido o acoplamento com `@fastify/sensible` para compatibilizar o runtime com Fastify 5
- corrigidos os caminhos reais de `start` e jobs para `dist/src/...` no build TypeScript
