import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { AppQueryProvider } from "./lib/query";
import { AppErrorBoundary, SentryRoutes } from "./lib/sentry";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PublicBookingPage } from "./pages/PublicBookingPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppQueryProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <SentryRoutes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<DashboardPage />} />
            <Route path="/b/:slug" element={<PublicBookingPage />} />
          </SentryRoutes>
        </BrowserRouter>
      </AppQueryProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
