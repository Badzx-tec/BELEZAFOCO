# 13. MCP Skill Usage Log

| MCP ou skill | Fase | Objetivo | Resultado | Impacto |
| --- | --- | --- | --- | --- |
| `superdesign` skill + CLI | design | puxar direcao visual real | drafts de landing e dashboard recuperados | guiou a linguagem visual do `apps/web` |
| `github` MCP | descoberta | auditar o legado | repo legada identificado e lido | confirmou reaproveito apenas semantico |
| `prisma-local` MCP | descoberta | validar learnings do schema antigo | detectado atrito do legado com Prisma 7 | levou ao uso de `prisma.config.ts` no greenfield |
| `context7` | descoberta | validar stack e docs | usado antes desta iteracao para Next, Nest e Prisma | consolidou a escolha da stack |
| `context7` | implementacao auth | confirmar o setup atual do Prisma 7 com driver adapter Postgres | documentacao oficial apontou uso de `@prisma/adapter-pg` com `PrismaClient({ adapter })` | evitou um runtime inconsistente e corrigiu o bootstrap do `api` e do seed |
| `linear` skill + MCP | planejamento | criar backlog real | projeto criado e issues `THA-19` a `THA-24` abertas | rollout saiu do plano para backlog executavel |
| `notion-knowledge-capture` skill + MCP | documentacao | registrar PRD e runbook | paginas do Notion atualizadas | criou fonte viva fora do repo |
| `figma` MCP | design | validar acesso | autenticado, sem arquivo alvo nesta sessao | mantido como refinamento opcional |
| `testsprite` MCP | qualidade | validar disponibilidade | conta Free confirmada | uso previsto para matriz de regressao |
| `sentry` MCP | observabilidade | validar workspace | org `thark-s4` confirmada | base pronta para release tracking |
| `shadcn` MCP | design system | validar registries | registry `@shadcn` confirmado em iteracao anterior | reforcou a escolha do design system |
| `chrome-devtools` MCP | QA visual | validar UI | bloqueado por profile atual | bloqueio registrado, QA visual pendente |
| `convex-mcp` | arquitetura | avaliar real-time | acesso nao autorizado e sem valor claro para o core | rejeitado formalmente para o core |
| `playwright` skill + binario local | qualidade | validar browser real e smoke tests | 3 smokes executados com sucesso | confirmou landing, booking e cockpit no browser real |
| `playwright` skill + binario local | qualidade auth slice | revalidar que a nova camada de sessao nao regrediu o frontend | smoke suite executada novamente com sucesso | confirmou que a fatia de auth nao quebrou landing, booking e cockpit |
| `github` MCP + git local | publicacao | publicar o greenfield em remoto existente | commit `0c638c4` publicado em `main` e `deploy/northflank-premium-launch` de `Badzx-tec/BELEZAFOCO` | garantiu um remoto funcional e deixou o Git pronto para acionar deploy por integracao |
| `playwright` skill + browser real | deploy | tentar operar GitHub/Northflank pelo navegador | GitHub e Northflank abriram em tela de login, sem sessao ativa | bloqueio confirmado para criacao de repo novo e deploy manual via dashboard |
| `github` MCP + git local | publicacao | substituir o remoto principal pelo snapshot greenfield | `main` e `deploy/northflank-premium-launch` atualizados para `ed3edfb` | deixou o remoto pronto para integracoes de deploy por Git |
| `playwright` skill + Playwright Test | auth frontend | revalidar shell autenticado e dashboard apos CSRF/RBAC | smoke voltou limpo apos evitar bootstrap de sessao sem cookie | confirmou que a camada visual nao regrediu com os guards novos |

## Rejeicoes formais
- Convex fora do core transacional.
- MongoDB fora do core transacional.
- codigo legado nao sera base da arquitetura nova.
