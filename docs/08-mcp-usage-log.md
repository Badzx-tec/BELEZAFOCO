# MCP Usage Log

Data base: 2026-03-10

Este log registra os MCPs efetivamente usados nesta execucao, em que etapa entraram e qual decisao concreta influenciaram.

## GitHub MCP

Etapa:

- auditoria inicial do repositorio

Uso:

- leitura da arvore remota
- validacao de branches e commits recentes

Impacto:

- confirmou que o branch `main` remoto esta atras do estado local
- ajudou a separar backlog estrutural do drift atual do workspace

## Prisma MCP

Etapa:

- revisao de banco e migrations

Uso:

- tentativa de `migrate status`

Impacto:

- revelou incompatibilidade entre o CLI `7.4.2` do MCP e o projeto ainda em Prisma `5.22`
- gerou a decisao de adiar a migracao para Prisma 7 e registrar isso como backlog de infraestrutura

## Context7

Etapa:

- validacao de documentacao atual antes da refatoracao do booking

Uso:

- consulta de `prisma.config.ts`
- consulta de transacao `Serializable` com retry para `P2034`

Impacto:

- embasou a mudanca do motor de agenda para transacao `Serializable`
- embasou o retry transacional no booking

## Linear

Etapa:

- organizacao do roadmap operacional

Uso:

- criacao do projeto `BELEZAFOCO Production Launch`
- criacao dos epicos `THA-5` a `THA-10`

Impacto:

- backlog profissional estruturado por fase
- visao de 30 dias alinhada ao objetivo de producao e venda

## Notion

Etapa:

- documentacao viva de produto e operacao

Uso:

- criacao da pagina `BELEZAFOCO PRD - Producao SaaS`
- criacao da pagina `BELEZAFOCO Runbook - Operacao e Lancamento`

Impacto:

- PRD curto e runbook inicial registrados fora do codigo

## Convex MCP

Etapa:

- avaliacao de uso complementar de realtime

Uso:

- consulta de `status`

Impacto:

- retornou ambiente nao autorizado e sem projeto
- reforcou a decisao arquitetural de rejeitar Convex neste ciclo

## TestSprite

Etapa:

- estrategia de testes

Uso:

- tentativa de gerar resumo de codigo e planos de teste

Impacto:

- a ferramenta indicou dependencia de artefatos temporarios ausentes em `testsprite_tests/tmp`
- isso foi registrado como limitacao operacional da sessao e compensado com estrategia manual em `docs/07-testing-strategy.md`

## Sentry MCP

Etapa:

- observabilidade real

Uso:

- identificacao de usuario e organizacao
- criacao dos projetos `belezafoco-api` e `belezafoco-web`

Impacto:

- deixou a organizacao `thark-s4` pronta para DSNs reais de API e web
- consolidou Sentry como stack oficial de observabilidade do projeto

## shadcn MCP

Etapa:

- preparacao da proxima rodada de UX premium

Uso:

- consulta de exemplos atuais de `sidebar`, `calendar` e `skeleton`

Impacto:

- forneceu referencias concretas para refatorar layout, agenda e estados de carregamento com menos improviso

## Figma MCP

Etapa:

- alinhamento de fluxo e hierarquia visual

Uso:

- geracao de diagrama FigJam da jornada de booking publico

Impacto:

- formalizou o fluxo mobile-first de reserva
- criou artefato visual reutilizavel para UX e demo

## Chrome DevTools MCP

Etapa:

- validacao real da experiencia no navegador
- tentativa de subida para Northflank

Uso:

- inspeção da landing page
- validacao do booking publico
- leitura de console e network

Impacto:

- encontrou o bug real de CORS entre `127.0.0.1` e `localhost`
- confirmou, apos a correcao, que o proximo erro restante era banco indisponivel e nao mais frontend/network
- confirmou que a sessao atual do navegador nao esta autenticada no Northflank, bloqueando a criacao automatica dos servicos nesta etapa

## Web oficial

Etapa:

- preparacao de deploy no Northflank

Uso:

- leitura da documentacao oficial atual do Northflank para build com `Dockerfile`, health checks e fluxo de servicos

Impacto:

- reforcou a decisao de manter `api`, `worker` e `web` como servicos separados
- guiou a criacao do guia `docs/09-deploy-northflank.md`
- guiou o ajuste do `Caddyfile` para usar upstream configuravel e probes dedicadas do `web`

## Observacao sobre Playwright

O pedido original exige Playwright, mas nenhum MCP de Playwright foi exposto nesta sessao. A decisao foi manter Playwright como padrao tecnico do repositorio e usar Chrome DevTools para validacao manual enquanto o MCP especifico nao esta disponivel.
