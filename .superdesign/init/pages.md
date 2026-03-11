# Page Dependency Trees

## Global dependencies

- `apps/web/src/index.css`
- `apps/web/src/components/ui.tsx`
- `apps/web/src/components/premium.tsx`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/lib/auth.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/format.ts`

## `/` (Landing)

- `apps/web/src/pages/LandingPage.tsx`
  - uses marketing surfaces, pricing cards and niche showcases
  - assets:
    - `apps/web/public/marketing/hero-cockpit-premium.svg`
    - `apps/web/public/marketing/mobile-booking-premium.svg`
    - `apps/web/public/marketing/dashboard-spotlight.svg`
    - `apps/web/public/niches/barbearia-premium.svg`
    - `apps/web/public/niches/salao-premium.svg`
    - `apps/web/public/niches/nail-premium.svg`

## `/auth`, `/auth/verify-email`, `/auth/reset-password`

- `apps/web/src/pages/AuthPage.tsx`
- `apps/web/src/pages/VerifyEmailPage.tsx`
- `apps/web/src/pages/ResetPasswordPage.tsx`
  - shared auth shell and clean editorial layout
  - backend contracts:
    - `/auth/config`
    - `/auth/register`
    - `/auth/login`
    - `/auth/google`
    - `/auth/verify-email`
    - `/auth/resend-verification`
    - `/auth/request-password-reset`
    - `/auth/reset-password`

## `/app`

- `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/components/AppShell.tsx`
  - backend contract:
    - `/me/dashboard/summary`

## `/app/setup`

- `apps/web/src/pages/OnboardingPage.tsx`
  - backend contracts:
    - `/me/workspace`
    - `/me/onboarding-summary`
    - `/me/services`
    - `/me/staff`
    - `/me/business-hours`

## `/app/agenda`

- `apps/web/src/pages/AgendaPage.tsx`
  - backend contracts:
    - `/me/appointments`
    - `/me/appointments/:id/status`
    - `/me/appointments/export.csv`
  - assets:
    - `apps/web/public/demo/agenda-board.svg`

## `/app/financeiro`

- `apps/web/src/pages/FinancePage.tsx`
  - backend contracts:
    - `/me/finance/dashboard`
    - `/me/finance/entries`
    - `/me/finance/entries/:id`
    - `/me/finance/commissions`
    - `/me/finance/cash-closures`
    - `/me/finance/export.csv`
  - assets:
    - `apps/web/public/finance/ledger-orbit.svg`

## `/app/billing`

- `apps/web/src/pages/BillingPage.tsx`
  - backend contracts:
    - `/me/billing/summary`
    - `/me/billing/request-upgrade`

## `/b/:slug`

- `apps/web/src/pages/PublicBookingPage.tsx`
  - backend contracts:
    - `/public/b/:slug`
    - `/public/b/:slug/slots`
    - `/public/b/:slug/book`
  - assets:
    - `apps/web/public/marketing/booking-cover.svg`
