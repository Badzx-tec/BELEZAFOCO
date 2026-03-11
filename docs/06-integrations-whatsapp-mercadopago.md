# Integrations: WhatsApp Cloud API and Mercado Pago

Canonical document for production payment and messaging integrations.

## WhatsApp Cloud API

- Provider abstraction remains server-side only.
- `GET/POST /messaging/webhooks/whatsapp` handles verification and inbound events.
- `WHATSAPP_CLOUD_API_APP_SECRET` enables signature validation with `X-Hub-Signature-256`.
- Outbound reminders, cancellations and reschedules are logged before and after provider calls.
- Templates remain the source of truth for production sends; no free-form session messaging is assumed for go-live.

Required envs:

- `WHATSAPP_PROVIDER=cloud_api`
- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_ID`
- `WHATSAPP_CLOUD_API_VERSION`
- `WHATSAPP_CLOUD_API_VERIFY_TOKEN`
- `WHATSAPP_CLOUD_API_APP_SECRET`

## Mercado Pago

- Pix creation remains server-to-server through `MercadoPagoProvider`.
- Creation requests preserve `X-Idempotency-Key`.
- Webhook reconciliation treats Mercado Pago as the payment source of truth.
- `WebhookEvent` is used for dedupe and audit trail.
- Appointment and finance ledger stay synchronized after payment status changes.

Required envs:

- `MERCADO_PAGO_ENABLED=true`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `API_BASE_URL`

Production webhook:

- `POST {API_BASE_URL}/payments/webhook/mercadopago`

## Operational rules

- No provider secret is exposed to the frontend.
- Webhook secrets are validated on the backend.
- All payment and webhook mutations must be idempotent.
- Reminder delivery must respect customer consent and provider rate limits.

## Notes

- This file supersedes the old integration notes kept in [05-integrations-whatsapp-mercadopago.md](/c:/Users/JUAN/Documents/BELEZAFOCO/docs/05-integrations-whatsapp-mercadopago.md).
- Meta production setup still depends on permanent token, phone number approval and approved templates in the business account.
