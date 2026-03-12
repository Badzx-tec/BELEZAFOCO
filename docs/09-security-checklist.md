# 09. Security Checklist

## Segredos
- Nunca usar valores herdados de `env.txt` em producao.
- Rotacionar tudo antes do primeiro deploy real.
- Usar secret groups no Northflank.

## Auth
- Cookies same-origin.
- Access token curto.
- Refresh token rotativo.
- CSRF por double-submit cookie em mutacoes autenticadas.
- `refresh`, `logout`, troca de workspace e mutacoes internas agora validam `x-csrf-token` contra sessao persistida.
- RBAC inicial habilitado com `RolesGuard` para superficies financeiras e cadastros operacionais sensiveis.

## Dados
- `workspaceId` em todos os agregados transacionais.
- Validacao forte na API com `ValidationPipe`.
- Sem PII em logs.

## Webhooks
- Validar assinatura e origem.
- Guardar idempotencia e payload bruto.
- Nao aplicar mutacao antes da verificacao.

## Operacao
- Health checks de web, api e worker.
- Sentry com releases e tags de contexto.
- Audit trail para auth e financeiro.
