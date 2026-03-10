# Page Dependency Trees

## `/` (Landing Page)

Entry: `apps/web/src/pages/LandingPage.tsx`

Dependencies:
- `apps/web/src/pages/LandingPage.tsx`
  - `apps/web/src/components/ui.tsx`
  - `react-router-dom`
  - brand assets:
    - `apps/web/public/marketing/hero-dashboard.svg`
    - `apps/web/public/marketing/hero-mobile-booking.svg`
    - `apps/web/public/niches/barbearia-card.svg`
    - `apps/web/public/niches/salao-card.svg`
    - `apps/web/public/niches/nail-card.svg`

## `/b/:slug` (Public Booking)

Entry: `apps/web/src/pages/PublicBookingPage.tsx`

Dependencies:
- `apps/web/src/pages/PublicBookingPage.tsx`
  - `apps/web/src/components/ui.tsx`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/lib/format.ts`
  - `react-router-dom`
  - brand assets:
    - `apps/web/public/marketing/booking-cover.svg`

## `/app` (Dashboard)

Entry: `apps/web/src/pages/DashboardPage.tsx`

Dependencies:
- `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/components/AppShell.tsx`
    - `apps/web/src/components/ui.tsx`
  - `apps/web/src/components/ui.tsx`
  - `apps/web/src/lib/format.ts`
  - `apps/web/src/lib/auth.tsx`
    - `apps/web/src/lib/api.ts`
  - `apps/web/src/components/ProtectedRoute.tsx`

## Globals required on every design command

- `apps/web/src/index.css`
- `apps/web/tailwind.config.js`
- `.superdesign/design-system.md`
