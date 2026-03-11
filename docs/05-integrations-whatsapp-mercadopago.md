# Integracoes: WhatsApp Cloud API e Mercado Pago

Data base: 2026-03-10

## WhatsApp

Estado atual:

- `WhatsAppCloudApiProvider` implementado no backend
- templates enviados pelo endpoint oficial `/{version}/{phone-number-id}/messages`
- `MessageTemplate` resolve o `templateName` real por tipo interno
- fallback opcional por email mantido
- webhook `GET/POST /messaging/webhooks/whatsapp` para verificacao e persistencia de eventos

Decisoes tecnicas:

- enviar apenas via backend
- manter `phone number id`, token e app secret apenas no servidor
- normalizar telefone antes do envio
- validar `X-Hub-Signature-256` quando `WHATSAPP_CLOUD_API_APP_SECRET` estiver configurado
- dedupe por `provider:eventId` em `WebhookEvent`

Variaveis obrigatorias:

- `WHATSAPP_PROVIDER=cloud_api`
- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_ID`
- `WHATSAPP_CLOUD_API_VERSION`
- `WHATSAPP_CLOUD_API_VERIFY_TOKEN`
- `WHATSAPP_CLOUD_API_APP_SECRET`

## Mercado Pago

Estado atual:

- `MercadoPagoProvider` cria Pix real por API HTTP
- `X-Idempotency-Key` mantido na criacao de pagamento
- `notification_url` prioriza `API_BASE_URL`
- webhook consulta o pagamento oficial e atualiza `Payment` e `Appointment`
- eventos ficam deduplicados em `WebhookEvent`

Decisoes tecnicas:

- criacao de pagamento sempre no backend
- webhook apenas dispara reconciliacao; a fonte de verdade final vem da consulta do recurso na API oficial
- validar assinatura do webhook com `x-signature` e usar `x-request-id` quando presente

Variaveis obrigatorias:

- `MERCADO_PAGO_ENABLED`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `API_BASE_URL`

## Regras obrigatorias

- nenhuma credencial no frontend
- assinatura e segredo validados no backend
- webhook com trilha em `WebhookEvent`
- idempotencia em criacao e em processamento
- lembrete 24h e 2h devem respeitar consentimento do cliente

## Observacao

- a tentativa de abrir a documentacao detalhada da Meta nesta sessao retornou limitacao do portal oficial
- a implementacao foi alinhada ao contrato publico conhecido da Cloud API e deve ser revalidada com o template aprovado antes do go-live final
