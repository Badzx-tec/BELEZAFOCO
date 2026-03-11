# Superdesign Frontend Map

Date base: 2026-03-11

## Source of truth

- Superdesign project:
  - `https://app.superdesign.dev/teams/58f4ad89-aee1-4011-9a79-8135d6a63ebe/projects/67a89ce9-de34-4eb1-98df-63ba98f2fb8b`
- Goal:
  - use the approved Superdesign project as the visual source of truth for `apps/web`
  - preserve the production logic already wired in BELEZAFOCO
  - port the pages by route instead of pasting static HTML verbatim

## Draft map

- Landing page
  - draft id: `d426420e-4718-4a65-9df9-c2c9e7839fc7`
  - preview: `https://p.superdesign.dev/draft/d426420e-4718-4a65-9df9-c2c9e7839fc7`
  - local route: `/`
  - local file: `apps/web/src/pages/LandingPage.tsx`
  - visual notes:
    - editorial hero with dual CTA and strong dashboard proof
    - premium proof ribbon
    - niche cards with stronger imagery and dark overlay treatment
    - premium pricing section with one featured card

- Auth / registration
  - draft id: `49d3669c-c107-4583-9ac4-517da6622bd6`
  - preview: `https://p.superdesign.dev/draft/49d3669c-c107-4583-9ac4-517da6622bd6`
  - local route: `/auth`
  - local file: `apps/web/src/pages/AuthPage.tsx`
  - visual notes:
    - floating top nav
    - editorial split layout
    - luxury onboarding copy on the left
    - clean white conversion form on the right

- Workspace setup / onboarding
  - draft id: `67110d19-1731-4641-8824-e41e3f6ea62d`
  - preview: `https://p.superdesign.dev/draft/67110d19-1731-4641-8824-e41e3f6ea62d`
  - local target:
    - next onboarding/configuration flow after authentication
  - status:
    - route not exposed yet
    - draft reserved as the visual basis for the onboarding rollout

- Operational dashboard
  - draft id: `9c9f5040-174f-4863-88e8-b3d359ffc128`
  - preview: `https://p.superdesign.dev/draft/9c9f5040-174f-4863-88e8-b3d359ffc128`
  - local route: `/app`
  - local files:
    - `apps/web/src/components/AppShell.tsx`
    - `apps/web/src/pages/DashboardPage.tsx`
  - visual notes:
    - editorial cockpit shell
    - premium KPI grid
    - left navigation with strong product identity
    - performance side panel with darker contrast

- Public booking
  - draft id: `52e60a34-548b-4d8a-bdc5-f5b9074ca9ce`
  - preview: `https://p.superdesign.dev/draft/52e60a34-548b-4d8a-bdc5-f5b9074ca9ce`
  - local route: `/b/:slug`
  - local file: `apps/web/src/pages/PublicBookingPage.tsx`
  - visual notes:
    - immersive business cover
    - trust signal cards
    - stronger service and professional selection
    - sticky premium booking summary with Pix emphasis

- Billing
  - draft id: `a7d7bf35-a2f2-426c-848d-d7c89e076ed2`
  - preview: `https://p.superdesign.dev/draft/a7d7bf35-a2f2-426c-848d-d7c89e076ed2`
  - local target:
    - SaaS billing / upgrade flow
  - status:
    - route not exposed yet
    - draft reserved as the visual basis for the billing rollout

## Implementation constraints

- Do not paste the Superdesign HTML into production untouched.
- Keep React, routing, auth, live booking data and real backend integration in the local app.
- Replace external hotlinked imagery from drafts with local assets from:
  - `apps/web/public/marketing`
  - `apps/web/public/niches`
  - `apps/web/public/professionals-placeholders`
- Keep typography and token fidelity:
  - headings: `Sora`
  - UI/body: `Manrope`
  - palette: cream + slate + amber

## Current status

- The Superdesign project has been fetched and mapped.
- `apps/web` now builds cleanly with the supporting design/runtime dependencies restored.
- The page-by-page migration can proceed against the draft map above without losing route ownership.
