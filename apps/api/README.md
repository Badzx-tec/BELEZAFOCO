# apps/api

NestJS API do BELEZAFOCO 2.0.

## Prefixo
- `/api/v1`

## Endpoints base
- `/health/live`
- `/health/ready`
- `/auth/*`
- `/me/*`
- `/public/bookings/*`
- `/webhooks/*`

## Comandos
```bash
corepack pnpm --filter @belezafoco/api start:dev
corepack pnpm --filter @belezafoco/api build
```
