# Security Checklist

## Segredos e ambiente

- [x] segredos sensíveis fora do código
- [x] envs versionadas apenas em exemplos
- [x] `DIRECT_URL` separado para migrations
- [ ] separar credenciais por ambiente real: dev, staging, prod

## Aplicação

- [x] auth JWT com access e refresh
- [x] RBAC por membership
- [x] tenant enforcement em middleware
- [x] rate limit global
- [x] sanitização básica de headers antes do envio ao Sentry
- [ ] rate limit específico por rota crítica
- [ ] auditoria ampliada para billing e financeiro

## Booking e pagamentos

- [x] idempotência namespaced por escopo e tenant
- [x] detecção de replay com payload divergente
- [x] webhook Mercado Pago com validação de assinatura quando configurada
- [ ] reconciliação periódica completa de pagamentos reais
- [ ] política de retenção para payloads sensíveis

## Operação

- [ ] revisar política de backup e restore
- [ ] revisar rotação de segredos
- [ ] revisar LGPD mínima para consentimento de comunicação
