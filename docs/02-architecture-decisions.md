# Decisões arquiteturais

## ADR-001: preservar o stack atual

Decisão: manter `Fastify + Prisma + React + Tailwind`.

Motivo:

- o domínio já está parcialmente modelado
- o custo de reescrita não se paga agora
- o foco do projeto é virar produto vendável com rapidez

## ADR-002: PostgreSQL no core transacional

Decisão: substituir SQLite como baseline principal.

Motivo:

- melhor concorrência
- melhor suporte a locking e transações
- melhor aderência a agenda, pagamentos e billing

## ADR-003: multi-tenant por `workspaceId`

Decisão: manter isolamento por linha no curto prazo.

Motivo:

- mais rápido para evoluir o produto
- suficiente para PMEs locais no estágio inicial

Próximo passo evolutivo:

- reforçar filtros e índices por `workspaceId`
- considerar schema-per-tenant ou partição apenas quando volume justificar

## ADR-004: scheduler centralizado em serviço de domínio

Decisão: regras de disponibilidade, buffers, bloqueios, recursos e conflitos devem sair das rotas e ficar em serviço central.

Motivo:

- evita duplicidade
- facilita testes
- reduz regressões

Implementação atual:

- slots públicos passam por serviço dedicado
- conflitos consideram preparo, buffers, exceções e bloqueios
- criação pública usa lock transacional via PostgreSQL para serializar agenda de profissional/recurso

## ADR-005: hardening de fluxos críticos

Decisão:

- refresh token com persistência
- webhook com segredo e idempotência
- booking público com idempotência e lock transacional

Motivo:

- esses são os pontos mais sensíveis para produção real

Implementação atual:

- refresh token persistido e rotacionado
- webhook com segredo e idempotência por evento
- booking público com `x-idempotency-key`

## ADR-006: frontend com foco em conversão e operação

Decisão:

- landing comercial forte
- booking público premium
- dashboard com utilidade operacional

Motivo:

- o produto precisa vender e operar, não apenas existir

## ADR-007: abstração de providers

Decisão:

- manter interfaces para WhatsApp, e-mail e pagamentos
- aceitar implementações mock no dev, mas com contrato pronto para produção

Motivo:

- evita acoplamento precoce
- facilita troca e homologação por cliente/cidade
