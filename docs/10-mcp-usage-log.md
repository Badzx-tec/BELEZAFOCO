# MCP Usage Log

Date base: 2026-03-11

## find-skills

- phase: capability discovery
- usage: reviewed the local skill instructions and confirmed the relevant skill inventory for design, deployment, docs and security-adjacent work
- impact: validated that `superdesign` and `find-skills` were the right local skills to anchor this wave

## superdesign

- phase: frontend source-of-truth alignment
- usage:
  - read the local Superdesign skill instructions
  - inspected the active project drafts
  - pulled approved HTML for landing and cockpit drafts
- impact:
  - locked the route-to-draft mapping
  - drove the decision to derive `/app/agenda` and `/app/financeiro` from the cockpit system instead of inventing a new visual language

## github

- phase: repository audit
- usage: audited the repo structure and remote branch context
- impact: confirmed monorepo boundaries, deploy branches and current app topology before deeper changes

## prisma-local

- phase: schema/runtime audit
- usage: attempted migration status against `apps/api`
- impact:
  - surfaced Prisma CLI 7 datasource friction
  - reinforced the decision to preserve the stable runtime line and document the upgrade path separately

## context7

- phase: sensitive integration validation
- usage:
  - verified Google token validation guidance
  - verified Prisma datasource / config direction for newer CLI generations
- impact:
  - supported the current Google server-side validation model
  - supported the “runtime stability first” Prisma decision

## chrome-devtools

- phase: live production validation
- usage: opened the published auth flow, checked console and network, and verified that the remaining Google error is external origin authorization
- impact: prevented a false backend rollback and kept the fix focused on platform configuration

## playwright

- phase: visual and flow validation
- usage:
  - validated the published auth flow independently from DevTools
  - navigated the Superdesign share flow to confirm route hierarchy and composition intent
- impact: confirmed that the public auth and cockpit mapping matched the intended product journey

## shadcn

- phase: design-system support
- usage: checked configured registries and validated the presence of the local shadcn registry path
- impact: confirmed that the local component strategy can stay wrapper-first, with shadcn as composition support rather than visual authority

## testsprite

- phase: quality planning
- usage: checked account status and credit tier
- impact:
  - confirmed Free-plan limits
  - documented that TestSprite is being used for risk/capacity awareness, not as the only quality gate in this wave

## figma

- phase: visual hierarchy support
- usage:
  - checked authenticated status
  - generated design-system rules guidance
- impact: reinforced the spacing, hierarchy and component-consistency pass applied to the shell and cockpit derivatives

## linear

- phase: rollout governance
- usage: inspected the existing `BELEZAFOCO Production Launch` project
- impact: kept the current delivery aligned with the already-created production launch backlog

## notion

- phase: documentation routing
- usage: attempted search / access
- result: blocked by authentication
- impact: formalized the repository docs as the live engineering documentation source for this wave

## sentry

- phase: observability audit
- usage: discovered the org and the existing projects `belezafoco-api` and `belezafoco-web`
- impact: confirmed that the project already has a valid target for final backend/frontend monitoring wiring

## convex-mcp

- phase: realtime evaluation
- usage: attempted workspace status lookup
- result: unauthorized
- impact: reinforced the decision to reject Convex as a transactional or near-term operational dependency

## Resulting deliverables influenced by MCPs / skills

- finance ledger schema + routes
- agenda and finance cockpit pages
- refreshed `.superdesign/init` route/page maps
- updated audit and architecture docs
- auth + Google docs
- updated MCP log and rollout docs
