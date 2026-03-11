# Superdesign Fidelity Plan

Date base: 2026-03-11

## Approved route mapping

- `/` => draft `d426420e-4718-4a65-9df9-c2c9e7839fc7`
- `/auth` => draft `49d3669c-c107-4583-9ac4-517da6622bd6`
- `/app` => draft `9c9f5040-174f-4863-88e8-b3d359ffc128`
- `/app/setup` => draft `67110d19-1731-4641-8824-e41e3f6ea62d`
- `/app/billing` => draft `a7d7bf35-a2f2-426c-848d-d7c89e076ed2`
- `/b/:slug` => draft `52e60a34-38fe-44e1-a76b-d2912f1988f8`

## Derived pages

- `/app/agenda`
  - derived from cockpit composition and sidebar hierarchy
- `/app/financeiro`
  - derived from cockpit composition and premium dark/light card system

## Gaps found

### Before implementation

- local shell lacked agenda and finance sections
- local Superdesign context files were stale
- finance backend could not support a premium finance screen

### After implementation

- core shell and derived pages now share the same editorial cockpit language
- route context and page dependencies were refreshed in `.superdesign/init/*`
- finance page now has real backend support

## Components mapped

- `AppShell`
- premium stat cards
- editorial dark hero cards
- workspace sidebar modules
- finance ledger cards
- agenda operational cards
- auth shell without backend implementation copy

## Assets required and now present

- `apps/web/public/demo/agenda-board.svg`
- `apps/web/public/finance/ledger-orbit.svg`
- existing marketing, niche and placeholder assets remain valid

## Completed in this wave

- cockpit navigation expansion
- `/app/agenda`
- `/app/financeiro`
- Superdesign route/page context refresh
- seed aligned with new finance visuals

## Pending for next fidelity wave

- deeper alignment of dashboard micro-layout to the exact remote draft spacing
- stronger visual parity on the public booking proof section
- richer chart styling once live data density increases
