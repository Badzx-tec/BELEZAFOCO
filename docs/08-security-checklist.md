# Security Checklist

## Auth

- JWT access and refresh secrets required
- refresh tokens persisted and revocable
- login route rate limited

## Permissions

- `x-workspace-id` required on protected routes
- role hierarchy enforced server-side
- owner/manager/receptionist/staff paths remain explicit

## Tenant isolation

- workspace membership lookup happens before protected route execution
- protected queries must continue filtering on `workspaceId`

## Secrets

- keep all provider credentials in Northflank secrets
- never store provider tokens in repo or logs

## Logs

- avoid logging access tokens, webhook secrets or raw credentials
- error reporting is env-driven through Sentry

## Webhooks

- verify provider secret before processing
- persist event ids and reject duplicates safely
- capture payload for audit without leaking secrets

## Payments

- use idempotency keys for payment creation
- keep appointment and payment state transitions transactional
- reconcile pending payments outside the request path

## Headers and HTTP

- strict production CORS
- HTTPS only in public deployment
- platform health checks on `/healthz` and `/readyz`
- `@fastify/helmet` enabled with CSP, HSTS in production and anti-framing defaults
- Fastify runs with `trustProxy` in production so rate limits and audit IPs reflect Northflank ingress correctly

## Rate limiting

- global Fastify rate limit enabled
- public booking route has tighter request budget

## Threat model

- public booking: abuse, spam and slot probing are mitigated with rate limiting, idempotency keys and transactional conflict checks
- auth: credential stuffing is partially mitigated with login rate limiting and revocable refresh tokens
- tenant boundary: workspace membership is enforced server-side before protected access and sensitive actions keep `workspaceId` filters
- payments: Mercado Pago webhooks now support HMAC signature validation plus constant-time fallback secret comparison for local/manual flows
- replay and duplicate events: timestamp tolerance and unique webhook event ids reduce replay acceptance and duplicate side effects
- reverse proxy boundary: request ids, trusted proxy headers and structured logs improve traceability without exposing raw secrets

## Remaining risks

- provider HTTP implementations still need credentialed end-to-end hardening
- public booking still lacks bot scoring/captcha for higher attack volumes
- no dedicated anti-automation layer exists on public booking yet
