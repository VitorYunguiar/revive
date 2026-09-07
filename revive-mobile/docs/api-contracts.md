# Contratos mobile

Base: `${EXPO_PUBLIC_API_URL}/v2`.

## Sessão

- `POST /auth/cadastro`: cria conta existente no modelo atual e retorna `access_token`, `refresh_token`, `expires_in` e `usuario`.
- `POST /auth/login`: autentica contas atuais.
- `POST /auth/refresh`: rotaciona o refresh token; reutilização revoga toda a família.
- `POST /auth/logout`: revoga a sessão apresentada.

O access token dura 15 minutos. O refresh token opaco dura 30 dias e somente seu hash SHA-256 é persistido.

## Leitura

- `GET /bootstrap`: retorna horário do servidor, usuário, vícios com métricas, registros, recaídas, metas e mensagem diária em uma chamada.

## Mutações idempotentes

As rotas abaixo exigem `Idempotency-Key` UUID:

- `POST /registros`
- `POST /vicios/:id/recaida`
- `POST /metas`
- `PATCH /metas/:id`

A mesma chave e payload devolvem a resposta original. A mesma chave com outro payload retorna `409 IDEMPOTENCY_CONFLITO`.

## Conta e dispositivos

- `DELETE /account`: remove conta e dados associados de modo transacional.
- `POST /devices/push-token`: registra um Expo push token para evolução de push remoto.
- `DELETE /devices/push-token`: revoga o token do dispositivo.

## Erros

```json
{
  "codigo": "DADOS_INVALIDOS",
  "mensagem": "Revise os campos informados.",
  "request_id": "uuid",
  "campos": { "email": "Informe um email valido." }
}
```

O cliente repete automaticamente uma requisição uma vez após um `401` e um refresh bem-sucedido. Somente rede, `429` e `5xx` entram em retry da fila.
