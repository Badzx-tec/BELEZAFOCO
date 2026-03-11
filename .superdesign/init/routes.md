# Route Map

## Router Source

`apps/web/src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./lib/auth";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PublicBookingPage } from "./pages/PublicBookingPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? "development",
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    integrations: [Sentry.browserTracingIntegration()],
    tracePropagationTargets: ["localhost", "127.0.0.1", /^\//]
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/b/:slug" element={<PublicBookingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
```

## Routes

- `/`
  - Component: `apps/web/src/pages/LandingPage.tsx`
  - Layout: standalone marketing page
  - Summary: hero, product proof, niche cards, pricing and CTA.
- `/auth`
  - Component: `apps/web/src/pages/AuthPage.tsx`
  - Layout: standalone authentication shell
- `/auth/verify-email`
  - Component: `apps/web/src/pages/VerifyEmailPage.tsx`
  - Layout: standalone verification state
- `/auth/reset-password`
  - Component: `apps/web/src/pages/ResetPasswordPage.tsx`
  - Layout: standalone reset flow
- `/app`
  - Component: `apps/web/src/pages/DashboardPage.tsx`
  - Layout: `ProtectedRoute` + `AppShell`
  - Summary: authenticated operational dashboard with KPIs, upcoming appointments and rankings.
- `/b/:slug`
  - Component: `apps/web/src/pages/PublicBookingPage.tsx`
  - Layout: standalone public booking journey
  - Summary: branded booking flow with service selection, slots, customer details and Pix summary.
