# MCP Usage Log

Data base: 2026-03-10

## GitHub MCP

- fase: auditoria inicial
- uso: leitura do espelho remoto, branches e árvore do repositório
- impacto: confirmou branch ativo `northflank-staging-20260310` e a base pronta para deploy

## Prisma Local MCP

- fase: auditoria de dados
- uso: tentativa de `migrate-status`
- impacto: revelou incompatibilidade entre o MCP em Prisma `7.x` e o projeto em Prisma `5.22`
- resultado: decisão de manter Prisma 5 agora e documentar o caminho de modernização

## Context7

- fase: decisões sensíveis
- uso: docs oficiais do Prisma e Sentry
- impacto: sustentou a separação `DATABASE_URL` / `DIRECT_URL` e confirmou setup moderno de tracing

## Web

- fase: pesquisa externa
- uso: docs oficiais do Mercado Pago Checkout API/Webhooks e Northflank deployment docs; pesquisa de concorrentes Fresha, Booksy, Vagaro, GlossGenius e Trinks
- impacto: embasou o adapter Pix real, a validação de webhook e a direção comercial/visual

## Linear

- fase: backlog
- uso: criação dos tickets `THA-11` a `THA-15`
- impacto: estruturou rollout por frentes: hardening transacional, Northflank, design system, financeiro e observabilidade

## Notion

- fase: documentação viva
- uso: criação do PRD curto e do runbook operacional
- impacto: registrou objetivo, escopo imediato e rollout inicial fora do repositório

## Figma

- fase: direção visual
- uso: geração do diagrama `BELEZAFOCO Booking Flow`
- impacto: consolidou o fluxo booking → Pix → webhook → confirmação/cancelamento

## shadcn

- fase: design system
- uso: leitura do registry configurado e exemplo de `sidebar-demo`
- impacto: definiu a próxima base visual do backoffice

## Sentry

- fase: observabilidade
- uso: descoberta de organização, projetos e DSNs existentes
- impacto: confirmou que `belezafoco-api` e `belezafoco-web` já existem em `thark-s4`

## TestSprite

- fase: estratégia de testes
- uso: tentativa de gerar code summary / PRD / plano de frontend
- impacto: revelou dependência de artefatos temporários em `testsprite_tests/tmp`
- resultado: bloqueado parcialmente; lacuna registrada

## Chrome DevTools

- fase: validação operacional
- uso: tentativa de abrir o produto e probes locais
- impacto: confirmou limitação do ambiente sem servidor web persistente e falha de conexão no momento da validação

## Playwright

- fase: validação operacional
- uso: tentativa de navegação nos probes HTTP
- impacto: também encontrou `ERR_CONNECTION_REFUSED` porque o servidor não estava disponível no momento

## Convex MCP

- fase: avaliação arquitetural
- uso: `status` do projeto
- impacto: retornou não autorizado
- decisão: rejeitado formalmente como core transacional

## Skills

- `superdesign`: indisponível nesta sessão, substituído por Figma MCP + auditoria local de UI
- `find-skills`: indisponível nesta sessão, substituído pela lista de skills já exposta em `AGENTS.md`

## Playwright Update

- fase: validaÃ§Ã£o do Northflank publicado
- uso: inspeÃ§Ã£o real da landing, auth e booking em `https://p03--belezafoco-api--fdzfclqyqq99.code.run/`
- impacto: confirmou que o deploy ativo estÃ¡ alinhado ao branch premium publicado e expÃ´s o problema de demo sem seed no booking pÃºblico
