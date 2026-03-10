# Integracoes: WhatsApp Cloud API e Mercado Pago

Data base: 2026-03-09

## Estado atual no repositorio

## WhatsApp

Hoje o repositorio tem apenas uma abstracao inicial:

- `MockWhatsAppProvider`
- `EmailFallbackProvider`
- `MessageTemplate`
- `MessageDelivery`

Isso e uma boa fundacao de contrato, mas ainda nao e integracao real.

## Mercado Pago

Hoje o repositorio tem:

- `MercadoPagoProvider`
- criacao de `Payment`
- endpoint de webhook
- `WebhookEvent`

Mas o provider ainda devolve payload simulado e o webhook ainda nao segue a validacao oficial completa.

## Direcao oficial pesquisada

## Mercado Pago

Fontes oficiais consultadas:

- Webhooks: https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
- Busca oficial do portal para webhook: https://www.mercadopago.com.br/developers/en/search?term=webhook
- Busca oficial do portal para PIX e payments API: https://www.mercadopago.com.br/developers/en/search?term=pix%20payments%20api

Decisoes tecnicas:

- criacao de pagamento sempre no backend
- usar `X-Idempotency-Key` em toda criacao de pagamento
- separar credenciais sandbox e producao
- webhook apenas dispara reconciliacao; a fonte de verdade final vem da consulta do recurso na API oficial
- validar assinatura do webhook com `x-signature` e usar `x-request-id` quando a notificacao trouxer esse header

Fluxo alvo para sinal Pix:

1. criar reserva em estado `pending_payment`
2. criar pagamento Pix no backend
3. persistir `externalId`, payload bruto, expiracao e idempotency key
4. receber webhook
5. validar assinatura e dedupe do evento
6. consultar pagamento oficial na API Mercado Pago
7. atualizar `Payment` e `Appointment` localmente

## WhatsApp Cloud API / Meta

Fontes oficiais consultadas:

- Cloud API overview: https://meta-preview.mintlify.io/docs/whatsapp/cloud-api
- Busca oficial Meta para Cloud API: https://developers.facebook.com/search/?q=whatsapp%20cloud%20api

Decisoes tecnicas:

- enviar apenas via backend
- manter `phone number id` e token apenas no servidor
- templates aprovados por tipo de mensagem
- persistir resposta do provedor e eventos de webhook
- dedupe por `dedupeKey`
- fallback por email opcional

Politica conservadora de envio:

- dentro da janela de atendimento ao cliente, permitir mensagem livre quando a conversa estiver aberta pela politica atual da Meta
- fora da janela, usar apenas templates aprovados

Observacao importante:

A mecanica acima esta alinhada ao comportamento atual da plataforma e ao overview oficial pesquisado, mas a pagina detalhada de pricing/policies da Meta nao ficou plenamente acessivel nesta sessao. Antes da implementacao final dos templates, a pagina exata da politica deve ser revalidada novamente.

## Contrato de provider recomendado

## WhatsApp

Interface alvo:

- `sendTemplate`
- `sendTextIfAllowed`
- `verifyWebhookSignature`
- `normalizeInboundEvent`

Persistencia minima:

- template utilizado
- variaveis
- telefone de destino
- status do envio
- provider message id
- payload bruto

## Mercado Pago

Interface alvo:

- `createPixCharge`
- `getPaymentStatus`
- `verifyWebhookSignature`
- `normalizeWebhookEvent`

Persistencia minima:

- `externalId`
- `status`
- `expiresAt`
- `pixCopyPaste`
- `qrCode`
- `idempotencyKey`
- `providerPayload`

## Regras obrigatorias de seguranca

- nenhuma credencial no frontend
- assinatura e segredo validados no backend
- webhook com trilha em `WebhookEvent`
- idempotencia em criacao e em processamento
- retries controlados e auditaveis
- separacao entre sandbox e producao por config

## Regras obrigatorias de negocio

- deposito confirmado muda agendamento para `confirmed`
- deposito expirado libera capacidade e cancela a reserva conforme politica
- lembrete 24h e 2h devem respeitar consentimento do cliente
- cancelamento e reagendamento devem disparar comunicacao consistente

## Variaveis de ambiente alvo

## WhatsApp

- `WHATSAPP_PROVIDER`
- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

## Mercado Pago

- `MERCADO_PAGO_ENABLED`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `MP_ENVIRONMENT`

## Fases de implementacao

## Fase 1

- provider real do Mercado Pago
- webhook oficial validado
- reconciliacao de pagamento

## Fase 2

- provider real do WhatsApp Cloud API
- templates por tipo de notificacao
- logs e retries

## Fase 3

- inbound webhooks da Meta
- fila e rate control
- fallback por email
