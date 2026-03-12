# 06. WhatsApp MercadoPago

## WhatsApp Cloud API
- Provider abstraction obrigatoria.
- Templates para lembrete 24h, lembrete 2h, cancelamento e reagendamento.
- Webhook de status com validacao de origem.
- Retries via worker.
- Log por envio em `NotificationLog`.

## Mercado Pago Pix
- Criacao de pagamento com `X-Idempotency-Key`.
- QR e copia-e-cola ligados ao booking.
- Webhook seguro com reconciliacao.
- `Payment` e `PaymentAttempt` guardam a trilha operacional.

## Estado atual
- Endpoints de webhook criados:
  - `POST /api/v1/webhooks/mercadopago`
  - `GET /api/v1/webhooks/whatsapp`
  - `POST /api/v1/webhooks/whatsapp`
- Booking publico e contrato de pagamento ja previstos no schema.
- Wiring real com providers e retries ainda pendente.
