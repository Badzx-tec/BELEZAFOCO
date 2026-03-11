import type { FastifyInstance, FastifyRequest } from "fastify";
import * as Sentry from "@sentry/node";
import { env } from "../config/env.js";

const sentryEnabled = Boolean(env.SENTRY_DSN_API);

export function initSentry(app: FastifyInstance) {
  if (!sentryEnabled) return;

  Sentry.init({
    dsn: env.SENTRY_DSN_API,
    environment: env.SENTRY_ENVIRONMENT,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE
  });

  Sentry.setupFastifyErrorHandler(app);
}

export function captureServerError(error: unknown, request?: FastifyRequest) {
  if (!sentryEnabled) return;

  Sentry.withScope((scope) => {
    if (request) {
      scope.setTag("route", request.routeOptions.url);
      scope.setTag("method", request.method);

      if (request.workspaceId) {
        scope.setTag("workspaceId", request.workspaceId);
      }

      if (request.membershipRole) {
        scope.setTag("membershipRole", request.membershipRole);
      }

      const userId = (request.user as { sub?: string } | undefined)?.sub;
      if (userId) {
        scope.setUser({ id: userId });
      }

      scope.setContext("http", {
        url: request.url,
        headers: {
          "x-workspace-id": request.headers["x-workspace-id"]
        }
      });
    }

    Sentry.captureException(error);
  });
}
