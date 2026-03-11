import { existsSync, readFileSync } from "node:fs";
import type { IncomingHttpHeaders } from "node:http";
import type { FastifyRequest } from "fastify";
import * as Sentry from "@sentry/node";
import { env } from "./config/env.js";

type PackageJson = {
  version?: string;
};

const packageJson = JSON.parse(readFileSync(resolvePackageJsonUrl(), "utf8")) as PackageJson;
const sentryEnabled = Boolean(env.SENTRY_DSN);
const defaultRelease = `belezafoco-api@${packageJson.version ?? "1.0.0"}`;
const defaultTraceSampleRate = env.NODE_ENV === "development" ? 1 : env.NODE_ENV === "production" ? 0.2 : 0.5;

if (sentryEnabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.SENTRY_RELEASE ?? defaultRelease,
    sendDefaultPii: false,
    integrations: [Sentry.prismaIntegration()],
    tracesSampler: ({ name, inheritOrSampleWith }) => {
      if (name.includes("/health") || name.includes("/ready")) {
        return 0;
      }
      return inheritOrSampleWith(env.SENTRY_TRACES_SAMPLE_RATE ?? defaultTraceSampleRate);
    },
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    }
  });
}

export function captureRequestError(error: unknown, request?: FastifyRequest) {
  if (!sentryEnabled) return;

  Sentry.withScope((scope) => {
    const requestUserId = typeof (request?.user as { sub?: string } | undefined)?.sub === "string" ? (request?.user as { sub?: string }).sub : null;

    if (requestUserId) {
      scope.setUser({ id: requestUserId });
    }
    if (request?.workspaceId) {
      scope.setTag("workspace_id", request.workspaceId);
    }
    if (request?.membershipRole) {
      scope.setTag("membership_role", request.membershipRole);
    }
    if (request) {
      scope.setContext("request", {
        method: request.method,
        url: request.url,
        route: request.routeOptions.url,
        headers: sanitizeHeaders(request.headers)
      });
    }
    Sentry.captureException(error);
  });
}

export function captureWorkerError(error: unknown, context: { job: string; extra?: Record<string, unknown> }) {
  if (!sentryEnabled) return;

  Sentry.withScope((scope) => {
    scope.setTag("worker_job", context.job);
    if (context.extra) {
      scope.setContext("worker", context.extra);
    }
    Sentry.captureException(error);
  });
}

export async function flushSentry(timeout = 2000) {
  if (!sentryEnabled) return true;
  return Sentry.flush(timeout);
}

function sanitizeHeaders(headers: IncomingHttpHeaders) {
  const nextHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (key === "authorization" || key === "cookie") continue;
    if (typeof value === "string") {
      nextHeaders[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      nextHeaders[key] = value.join(", ");
    }
  }

  return nextHeaders;
}

function resolvePackageJsonUrl() {
  const candidates = [
    new URL("../package.json", import.meta.url),
    new URL("../../package.json", import.meta.url)
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Nao foi possivel localizar o package.json da API para definir o release do Sentry.");
}
