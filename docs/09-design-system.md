# Design System

Date base: 2026-03-11

## Direction

- premium beauty SaaS
- editorial first impression, operational clarity inside the product
- warm accent with controlled dark surfaces
- mobile-first, but without flattening the desktop experience

## Source of truth

- primary: approved Superdesign project and mapped drafts
- secondary: local primitives in `apps/web/src/components/ui.tsx` and `apps/web/src/components/premium.tsx`

## Canonical route-to-design mapping

- `/` => Superdesign landing draft
- `/auth` => Superdesign auth draft
- `/app` => Superdesign cockpit draft
- `/app/setup` => Superdesign onboarding draft
- `/app/billing` => Superdesign billing draft
- `/b/:slug` => Superdesign public booking draft
- `/app/agenda` => derived from cockpit system
- `/app/financeiro` => derived from cockpit system

## Core primitives

- `Card`
- `Button`
- `Badge`
- `Field`
- `Input`
- `Textarea`
- `EmptyState`
- `SkeletonBlock`
- `AppShell`

## App shell rules

- dark sticky sidebar
- strong workspace framing
- editorial header copy
- quick action row
- compact premium stat rail

## Visual tokens in practice

- primary dark: slate / graphite surfaces
- accent: warm amber / copper
- radius: soft large radii, mostly `20px` to `30px`
- shadows: limited but high-quality, mostly on primary CTAs and selected cards
- contrast: strong foregrounds, low-noise secondary text

## Asset map

- `apps/web/public/marketing/*`
- `apps/web/public/niches/*`
- `apps/web/public/professionals-placeholders/*`
- `apps/web/public/demo/agenda-board.svg`
- `apps/web/public/finance/ledger-orbit.svg`

## Component strategy

- preserve custom primitives already shipping well
- use shadcn as registry and composition reference, not as visual authority over Superdesign
- prefer wrappers and composition over direct wholesale component dumps

## Current gaps intentionally left for next wave

- charts can evolve from static composition into a stronger data-visualization layer
- agenda timeline can gain drag/drop later
- finance can gain PDF reporting later
