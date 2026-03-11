# Auth Integrations: Google + Email

Date base: 2026-03-11

## Scope

This document defines the production auth architecture for BELEZAFOCO:

- email registration
- email login
- email verification
- password reset
- Google OAuth using Google Identity Services on the frontend and server-side token validation on the backend

## Architecture

### Email registration

- frontend route: `/auth`
- backend endpoint: `POST /auth/register`
- result:
  - creates `User`
  - creates `Workspace`
  - creates `Membership(role=owner)`
  - creates verify-email token
  - sends verification email

### Email verification

- frontend route: `/auth/verify-email`
- backend endpoint: `POST /auth/verify-email`
- result:
  - consumes token once
  - sets `emailVerifiedAt`
  - creates session payload
  - redirects user into `/app/setup`

### Email login

- frontend route: `/auth`
- backend endpoint: `POST /auth/login`
- result:
  - requires valid password hash
  - blocks unverified email login with explicit response
  - returns access token + refresh token + user + workspaces

### Password reset

- frontend route: `/auth/reset-password`
- backend endpoints:
  - `POST /auth/request-password-reset`
  - `POST /auth/reset-password`
- result:
  - sends reset link
  - consumes token once
  - updates password hash
  - invalidates old session path through normal auth token rotation

### Google OAuth

- frontend route: `/auth`
- frontend SDK: Google Identity Services
- backend endpoint: `POST /auth/google`
- result:
  - frontend sends `credential`
  - backend validates ID token with `google-auth-library`
  - backend checks token issuer, audience and expiration
  - if the Google email matches an existing user, `googleSub` is linked
  - if the Google profile is new, backend can return `mode: needs_registration`

## Account linking policy

- if Google returns a verified email already present in `User.email`, the same account is reused
- `googleSub` is attached to that existing user
- `emailVerifiedAt` is filled if it was empty
- no duplicate user should be created for the same verified email

## Environment variables

### Required for email auth

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PUBLIC_URL`
- `API_BASE_URL`
- `APP_URL`

### Required for Google auth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_ALLOWED_ORIGINS`

## Origin / callback setup

Current BELEZAFOCO production flow does not use redirect-based OAuth callback URIs.

The active requirement is `Authorized JavaScript origins` in Google Cloud Console:

- `https://p03--belezafoco-api--fdzfclqyqq99.code.run`
- `http://localhost:5173`

`Authorized redirect URIs` can stay empty for the current Google Identity Services flow.

## Backend token validation rule

The backend must validate the Google ID token server-side and must not trust raw client payload claims.

Checks required:

- signature validation by Google library
- `aud`
- `iss`
- `exp`

## Local vs production

### Local

- `PUBLIC_URL` can remain local
- Google origin must include `http://localhost:5173`

### Production

- `PUBLIC_URL`, `API_BASE_URL` and `APP_URL` must point to the published domain
- Google origin must include the live domain
- live verification requires Google Cloud origin propagation

## Troubleshooting

### Google button renders but fails with `origin is not allowed`

Cause:

- Google Cloud origin not saved or not propagated yet

Check:

- `Authorized JavaScript origins`
- `GOOGLE_ALLOWED_ORIGINS`
- `/auth/config`

### Verification email arrives but user does not enter the app

Check:

- token is not already consumed
- `PUBLIC_URL` points to the correct frontend origin
- `/auth/verify-email` is reachable as a deep link

### Login says email not verified

Expected behavior:

- password login remains blocked until `emailVerifiedAt` exists

Operator action:

- use resend verification flow

### Google is configured but hidden

Cause:

- `/auth/config` detected that the current origin is not allowed

Operator action:

- align Google Console and envs first, then redeploy/reload
