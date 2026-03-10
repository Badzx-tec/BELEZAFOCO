# Auditoria Tecnica do BELEZAFOCO

Data da auditoria: 2026-03-10

## Escopo validado nesta execucao

- auditoria do repositorio local e do espelho remoto via GitHub MCP
- leitura do schema Prisma e tentativa de `migrate status` via Prisma MCP
- validacao de docs atuais via Context7
- validacao de build e testes do monorepo
- validacao manual da UX no navegador via Chrome DevTools
- criacao de backlog operacional no Linear
- registro de PRD e runbook no Notion
- sondagem de observabilidade real no Sentry

## Resumo executivo

O BELEZAFOCO ja tem base de produto, stack correta e direcao comercial coerente para beauty SaaS no Brasil. O monorepo builda, os testes atuais passam, o core relacional em Prisma/PostgreSQL esta bem encaminhado e a experiencia visual da landing e do booking tem identidade acima do nivel de template barato.

O projeto ainda nao esta pronto para producao real. Os bloqueios atuais nao pedem reescrita; pedem hardening objetivo. Nesta execucao foi entregue a primeira refatoracao estrutural critica do motor de agenda: `Resource.capacity` passou a ser respeitado por unidade de recurso com alocacao transacional e retry serializable. Tambem foi corrigido um problema real de ambiente local entre `localhost` e `127.0.0.1`, e o runtime da API voltou a subir com Fastify 5 apos corrigir a major do `@fastify/sensible`.

O principal bloqueio operacional restante hoje e infraestrutura local: o backend sobe, mas o banco nao esta acessivel em `localhost:5432`, e o Docker Desktop local esta com daemon indisponivel. Isso impede validar o fluxo completo do booking publico, seed e queries reais nesta sessao.

## Estado atual confirmado

## O que esta bom

- monorepo `pnpm` com separacao clara entre `apps/api`, `apps/web` e `packages/shared`
- backend em Fastify + Zod + Prisma com `health` e `ready`
- frontend React + Vite + Tailwind com direcao visual comercial consistente
- schema relacional amplo para workspaces, memberships, staff, servicos, agenda, pagamentos, mensagens e auditoria
- idempotencia inicial para booking e webhooks
- Sentry ja integrado em codigo para API e frontend
- build e testes atuais passam localmente

## O que foi corrigido nesta rodada

- `AppointmentSegment` agora suporta capacidade real de recurso por `resourceUnit`
- o booking passou a usar transacao `Serializable` com retry para conflito `P2034`, alinhado a recomendacao atual do Prisma
- o calculo de slots agora so bloqueia recurso quando todas as unidades daquele horario estiverem ocupadas
- o frontend deixou de depender de um fallback fixo para `http://localhost:3333`, inferindo o host correto quando roda em preview/dev
- o backend passou a aceitar por default origens locais de `localhost` e `127.0.0.1` em portas `5173` e `4173`
- o runtime da API voltou a ser compativel com Fastify 5 com `@fastify/sensible@6`

## Validacoes executadas

- `corepack pnpm -r test`: aprovado
- `corepack pnpm -r build`: aprovado
- `corepack pnpm --filter @belezafoco/api prisma:generate`: aprovado
- `GET /health` em `http://127.0.0.1:3333/health`: aprovado
- Chrome DevTools em `http://localhost:5173/b/demo-beleza`: CORS corrigido; erro restante passou a ser conexao com banco, nao mais origem cruzada

## Riscos e bloqueios atuais

## 1. PostgreSQL local indisponivel

Fato observado:

- o backend responde em `health`, mas qualquer query Prisma falha com `Can't reach database server at localhost:5432`
- o Docker CLI existe, porem o daemon do Docker Desktop nao esta ativo nesta maquina

Impacto:

- sem banco ativo nao ha como validar seed, dashboard autenticado, booking publico real ou migrations aplicadas

## 2. Prisma MCP exposto a incompatibilidade de toolchain

Fato observado:

- o Prisma MCP usa Prisma CLI `7.4.2`
- o projeto segue em Prisma `5.22.0`
- o `schema.prisma` ainda usa `datasource.url`, o que o CLI 7 ja nao aceita no mesmo formato

Impacto:

- o review via Prisma MCP foi util para detectar o problema, mas o fluxo completo de migrate/status via MCP continua bloqueado
- isso nao quebra o app em si, mas precisa entrar no backlog de modernizacao da toolchain

## 3. Integracoes externas ainda nao sao reais

Estado atual:

- Mercado Pago continua em modo adapter stub
- WhatsApp Cloud API continua em camada mock/provider inicial

Impacto:

- o produto ainda nao entrega sinal Pix real nem lembretes reais no WhatsApp

## 4. Cobertura automatizada ainda e estreita

Estado atual:

- testes existentes cobrem scheduler, plano, dedupe de reminder e agora capacidade de recurso
- ainda faltam testes de auth, multi-tenant leakage, webhook, refresh, booking end-to-end e API integration

Impacto:

- a base melhorou no coracao da agenda, mas ainda nao tem rede de seguranca suficiente para go-live

## 5. Frontend autenticado ainda concentra muita logica em paginas grandes

Fato observado:

- `DashboardPage.tsx` continua grande, com leitura, mutacoes e apresentacao acopladas

Impacto:

- manutencao mais cara
- menor clareza para evoluir onboarding, agenda e CRM de forma profissional

## 6. Playwright MCP nao esta disponivel nesta sessao

Fato observado:

- o pedido original exige Playwright, mas esta sessao nao expõe um MCP de Playwright

Impacto:

- a validacao de navegador desta rodada foi feita com Chrome DevTools
- a estrategia continua sendo adotar Playwright no repositorio como padrao de E2E, mas a automacao via MCP nao pode ser executada nesta sessao

## Decisao tecnica consolidada

- manter Fastify + Prisma + PostgreSQL + React + Vite
- rejeitar reescrita do core
- endurecer backend por dominio
- manter Convex fora do core e fora do escopo atual ate existir caso real de realtime complementar

## Proximos passos recomendados

1. Levantar PostgreSQL local ou staging para validar migrations, seed e booking end-to-end.
2. Implementar camada real de Mercado Pago com idempotencia e reconciliacao.
3. Implementar camada real de WhatsApp Cloud API com templates, logs e retries.
4. Extrair `DashboardPage` em modulos menores e introduzir agenda diaria/semanal/mensal de verdade.
5. Adicionar suite de testes de API e E2E com Playwright no proprio repositorio.
