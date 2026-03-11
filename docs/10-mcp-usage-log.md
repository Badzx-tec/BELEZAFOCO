# MCP Usage Log

Date base: 2026-03-11

## GitHub MCP

- phase: repository audit and remote alignment
- usage: read the remote repository tree and branch inventory for `Badzx-tec/BELEZAFOCO`
- impact: confirmed the live repo shape and the presence of Northflank-related branches before making runtime decisions

## Prisma Local MCP

- phase: data/runtime audit
- usage: `migrate-status` against `apps/api`
- impact: surfaced the Prisma CLI 7.4.2 incompatibility with datasource `url` / `directUrl`
- decision influenced: documented Prisma 7 upgrade as a planned path instead of an unreviewed hot migration

## Context7

- phase: sensitive architecture decisions
- usage: queried Prisma docs for Prisma 7 datasource config, `prisma.config.ts` and direct connection guidance
- impact: confirmed the runtime/migration split and the upgrade implications before touching deployment docs

## Web research

- phase: deployment and integration research
- usage: official searches for Northflank combined services/jobs, Mercado Pago webhook validation, and WhatsApp Cloud API references
- impact: reinforced the Northflank combined-service model and the webhook security expectations captured in the docs

## Chrome DevTools

- phase: production validation
- usage: opened the published `/auth` page and captured console + network state
- impact: found the live Google Sign-In origin mismatch and the missing `id` / `name` warning on form fields

## Playwright

- phase: production validation
- usage: navigated to the same live auth page and reproduced the auth errors in a second browser automation stack
- impact: confirmed the bug was real and user-facing, not a DevTools-only artifact

## shadcn MCP

- phase: design-system direction
- usage: inspected registry availability and searched/viewed `sidebar`, `calendar`, `chart`, `table`, plus the `dashboard-01` example
- impact: provided concrete UI primitives and dashboard composition references for future premium backoffice work

## Figma MCP

- phase: product/flow visualization
- usage: generated an editable FigJam flow for the onboarding -> booking -> Pix -> reminders -> dashboard path
- impact: created a reusable artifact for rollout alignment and design communication
- artifact: `BELEZAFOCO Production Flow`

## Superdesign skill

- phase: visual direction setup
- usage: read `.superdesign/init/*`, verified CLI, fetched the live skill instructions and created project `BELEZAFOCO Premium Auth`
- impact: established a real Superdesign project for premium UI work
- rejected step: draft generation was blocked by insufficient team credits, so implementation continued with local code + Figma + shadcn guidance

## Superdesign remote project reuse

- phase: frontend migration alignment
- usage: fetched all draft nodes for project `67a89ce9-de34-4eb1-98df-63ba98f2fb8b` and read the HTML for the landing, auth, dashboard, booking and billing drafts
- impact: locked the approved remote frontend as the visual source of truth for `apps/web`
- deliverable: `docs/17-superdesign-frontend-map.md` with exact draft-to-route mapping

## Superdesign remote sync follow-up

- phase: auth/onboarding/billing implementation
- usage: fetched the live draft HTML for `49d3669c-c107-4583-9ac4-517da6622bd6`, `67110d19-1731-4641-8824-e41e3f6ea62d` and `a7d7bf35-a2f2-426c-848d-d7c89e076ed2`
- impact: drove the final local implementation of the clean auth shell, the new `/app/setup` onboarding route and the new `/app/billing` subscription route
- decision influenced: kept the editorial split layout from Superdesign while replacing unsupported fake checkout fields with real workspace-backed upgrade requests

## find-skills skill

- phase: skill discovery
- usage: reviewed the local skill instructions and attempted `npx skills find northflank deployment`
- impact: confirmed no better installable skill path was required for this pass
- rejected step: the CLI search timed out and did not change the execution plan

## Linear MCP

- phase: rollout governance
- usage: inspected the existing project and created `THA-16`, `THA-17`, `THA-18`
- impact: mapped the current mission into urgent backlog items for auth, Prisma/Northflank and production-readiness work

## Notion MCP

- phase: living documentation
- usage: searched the workspace for existing BELEZAFOCO PRD/runbook pages and created two delta pages for this pass
- impact: preserved an external written trace of the production auth bug, the deploy delta and the required next actions

## Sentry MCP

- phase: observability audit
- usage: identified org `thark-s4`, confirmed projects `belezafoco-api` and `belezafoco-web`, and verified DSNs exist
- impact: confirmed Sentry wiring can be completed from existing org/project assets without creating new projects

## TestSprite MCP

- phase: test-strategy exploration
- usage: attempted code summary, PRD generation and frontend/backend test plan generation
- impact: exposed that the workspace is missing expected TestSprite temp artifacts and that the current flow is only partially usable
- rejected step: automated plan generation could not complete cleanly, so the testing strategy remains documented manually for now

## Convex MCP

- phase: architecture evaluation
- usage: checked project status
- impact: returned unauthorized
- decision influenced: Convex remains formally rejected as a transactional core and is not part of the current production path

## Playwright follow-up validation

- phase: auth UX validation
- usage: exercised the rebuilt register tab locally and confirmed password visibility toggles, double-password fields and automatic slug generation from the business name
- impact: verified the requested auth behavior before deploy

## Chrome DevTools follow-up validation

- phase: combined-service validation
- usage: loaded the rebuilt `/auth` page from the local Fastify combined service and checked console plus network state
- impact: confirmed the auth shell, bundled assets and `/auth/config` request load cleanly in the same-origin deploy model
