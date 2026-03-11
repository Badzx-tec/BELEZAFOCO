# Route Map

## Router Source

`apps/web/src/main.tsx`

## Routes

- `/`
  - Component: `apps/web/src/pages/LandingPage.tsx`
  - Source of truth: Superdesign draft `d426420e-4718-4a65-9df9-c2c9e7839fc7`
  - Notes: marketing homepage with editorial hero, niche cards, pricing and CTA.
- `/auth`
  - Component: `apps/web/src/pages/AuthPage.tsx`
  - Source of truth: Superdesign draft `49d3669c-c107-4583-9ac4-517da6622bd6`
  - Notes: clean auth shell for email login, email register, password reset and Google OAuth.
- `/auth/verify-email`
  - Component: `apps/web/src/pages/VerifyEmailPage.tsx`
  - Source of truth: follows auth shell system
  - Notes: consumes email verification token and redirects to `/app/setup`.
- `/auth/reset-password`
  - Component: `apps/web/src/pages/ResetPasswordPage.tsx`
  - Source of truth: follows auth shell system
  - Notes: reset password flow without backend implementation copy.
- `/app`
  - Component: `apps/web/src/pages/DashboardPage.tsx`
  - Source of truth: Superdesign draft `9c9f5040-174f-4863-88e8-b3d359ffc128`
  - Notes: cockpit with KPIs, funnel, upcoming appointments and rankings.
- `/app/setup`
  - Component: `apps/web/src/pages/OnboardingPage.tsx`
  - Source of truth: Superdesign draft `67110d19-1731-4641-8824-e41e3f6ea62d`
  - Notes: workspace identity, services, staff and business hours.
- `/app/agenda`
  - Component: `apps/web/src/pages/AgendaPage.tsx`
  - Source of truth: derived from dashboard system and Superdesign cockpit language
  - Notes: daily operations, receptionist filters, status updates and CSV export.
- `/app/financeiro`
  - Component: `apps/web/src/pages/FinancePage.tsx`
  - Source of truth: derived from dashboard system and Superdesign cockpit language
  - Notes: financial ledger, category breakdown, manual entries, commissions and cash closure.
- `/app/billing`
  - Component: `apps/web/src/pages/BillingPage.tsx`
  - Source of truth: Superdesign draft `a7d7bf35-a2f2-426c-848d-d7c89e076ed2`
  - Notes: founder plans, usage limits and audited upgrade request.
- `/b/:slug`
  - Component: `apps/web/src/pages/PublicBookingPage.tsx`
  - Source of truth: Superdesign draft `52e60a34-38fe-44e1-a76b-d2912f1988f8`
  - Notes: branded public booking journey with service, staff, slot, customer data and Pix summary.
