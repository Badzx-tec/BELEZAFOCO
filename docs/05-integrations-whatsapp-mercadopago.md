# WhatsApp and Mercado Pago Integrations

## Architecture

- messaging provider abstraction lives in `apps/api/src/modules/messaging/provider.ts`
- payment provider abstraction lives in `apps/api/src/modules/payments/provider.ts`
- payment webhook endpoint lives in `apps/api/src/modules/payments/routes.ts`
- booking flow links payment state directly to appointment state

## WhatsApp Cloud API

### Environment

- `WHATSAPP_PROVIDER=cloud_api`
- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_ID`

### Production shape

- approved templates for confirmation, reminder_24h, reminder_2h, cancellation and reschedule
- send logs persisted through `ReminderLog`
- retries must be controlled and idempotent
- fallback email remains optional for non-opted-in or failed deliveries

### Security

- store tokens only in Northflank secrets
- validate webhook signatures and verify tokens
- never log raw access tokens
- keep customer consent fields populated on client records

## Mercado Pago Pix

### Environment

- `MERCADO_PAGO_ENABLED=true`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`

### Production requirements

- create charges with `X-Idempotency-Key`
- persist provider `externalId`
- validate webhook authenticity before updating payment state
- persist received events in `WebhookEvent`
- reconcile pending payments on a schedule

### Webhook validation

- production path: validate Mercado Pago `x-signature` plus `x-request-id`
- accepted manifest shape in the repo: `id:{data.id};request-id:{x-request-id};ts:{ts};`
- reject stale signatures older than five minutes before touching `Payment` or `Appointment`
- local/manual fallback: `x-webhook-secret` still works for controlled testing, using constant-time comparison

### Current repo state

- Pix provider already supports real `POST /v1/payments` creation with `X-Idempotency-Key` when `MP_ACCESS_TOKEN` is configured
- webhook processing can resolve official notifications by querying `GET /v1/payments/{id}` before mutating local payment state
- local demo/manual fallback remains available for controlled testing without provider callbacks

## Webhooks

- keep one endpoint per provider
- persist incoming event id before applying state changes
- acknowledge duplicates with `200`
- record raw payload for audit/troubleshooting
- prefer using the provider request id as the primary event correlation id when available

## Idempotency

- booking already accepts `x-idempotency-key`
- payment creation must reuse the same idempotency key per booking attempt
- webhook processing must key on provider event id

## Troubleshooting

- payment stuck pending:
  inspect `Payment`, `WebhookEvent` and reconciliation logs
- duplicate reminders:
  inspect `ReminderLog` unique constraint per appointment/type
- WhatsApp not sending:
  confirm template approval, token validity and opt-in state

## References

- Mercado Pago developers docs: https://www.mercadopago.com.br/developers
- WhatsApp Cloud API docs: https://developers.facebook.com/docs/whatsapp
