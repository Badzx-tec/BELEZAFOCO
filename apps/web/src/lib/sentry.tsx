import React, { type PropsWithChildren } from "react";
import * as Sentry from "@sentry/react";
import { createRoutesFromChildren, matchRoutes, Routes, useLocation, useNavigationType } from "react-router-dom";
import { API_URL, type Session } from "./api";

const sentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN);
const defaultTraceSampleRate = import.meta.env.DEV ? 1 : 0.2;
const tracePropagationTargets: Array<string | RegExp> = [/^\//];
const apiOrigin = resolveOrigin(API_URL);

if (apiOrigin) {
  tracePropagationTargets.push(apiOrigin);
}

if (sentryEnabled) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: __BELEZAFOCO_WEB_RELEASE__,
    sendDefaultPii: false,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      })
    ],
    tracePropagationTargets,
    tracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, defaultTraceSampleRate),
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
      }
      return event;
    }
  });
}

export const SentryRoutes = sentryEnabled ? Sentry.withSentryReactRouterV6Routing(Routes) : Routes;

export function AppErrorBoundary({ children }: PropsWithChildren) {
  if (!sentryEnabled) {
    return <>{children}</>;
  }

  return (
    <Sentry.ErrorBoundary fallback={<FatalErrorState />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}

export function syncSentrySession(session: Session | null) {
  if (!sentryEnabled) return;

  if (!session) {
    Sentry.setUser(null);
    Sentry.setTag("workspace_id", "anonymous");
    return;
  }

  Sentry.setUser({
    id: session.user.id,
    email: session.user.email
  });
  Sentry.setTag("workspace_id", session.activeWorkspaceId);
}

function FatalErrorState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-white/50">BELEZAFOCO</p>
        <h1 className="font-display text-4xl">O painel encontrou um erro inesperado.</h1>
        <p className="text-sm leading-7 text-white/72">O problema foi registrado para analise. Recarregue a pagina para tentar novamente.</p>
      </div>
    </div>
  );
}

function parseSampleRate(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
    return parsed;
  }
  return fallback;
}

function resolveOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
