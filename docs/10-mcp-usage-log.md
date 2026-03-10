# MCP Usage Log

Date: 2026-03-10

## Used MCPs

### Linear

- created project `BELEZAFOCO Premium Productionization`
- created PRD/runbook document in Linear as a Notion fallback
- created backlog issues `CAR-11` through `CAR-15`

Decision influenced:

- formal project tracking exists outside the repo even though Notion was unavailable

### Context7

- consulted Prisma production deployment guidance
- consulted Sentry JavaScript/Fastify/React setup guidance
- consulted Fastify trust-proxy and `@fastify/helmet` guidance

Decision influenced:

- use `prisma migrate deploy` for production jobs
- prefer env-driven optional Sentry integration
- enable security headers and production proxy awareness in the API

### Playwright

- audited landing, dashboard and booking pages
- validated console cleanliness
- validated mobile viewport behavior
- validated the public booking production flow end to end
- operated the live Northflank UI to inspect service state, open pod shell, update environment variables and validate the production booking flow on the public domain

Decision influenced:

- fix booking crash on invalid public slugs
- add local visual assets
- add repository Playwright smoke coverage
- isolate the app in PostgreSQL schema `belezafoco` after the addon `public` schema was found to be shared

### Sentry MCP

- searched official Sentry docs
- confirmed current authenticated user

Decision influenced:

- backend/frontend env model for Sentry initialization

### Convex MCP

- checked project status
- result: not authorized / no project configured

Decision influenced:

- formal rejection of Convex for the transactional core in ADR-008

### Figma

- used design-system rules prompt generation to structure token/component documentation

Decision influenced:

- `docs/09-design-system.md` structure and local asset standards

### Web research

- reviewed Northflank docs and official vendor pages
- reviewed competitor positioning pages
- reviewed Mercado Pago and Sentry docs

Decision influenced:

- combined-service Northflank path
- dedicated-schema bootstrap path for shared Northflank Postgres addons
- Pix/WhatsApp documentation scope
- landing page positioning direction
- Mercado Pago webhook signature and anti-replay design

## Requested MCPs that were not available

- github
- notion
- chrome-devtools
- prisma-local
- shadcn
- testsprite

## Fallbacks used

- local `git` + shell audit instead of GitHub MCP
- local docs + Linear document instead of Notion
- Playwright instead of chrome-devtools
- local Prisma/schema inspection instead of prisma-local
- local component system and CSS tokens instead of shadcn MCP
- testing matrix documented manually instead of testsprite
