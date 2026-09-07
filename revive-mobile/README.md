# Revive Mobile

Aplicativo Expo/React Native do Revive. O cliente se comunica exclusivamente com a API Express existente; nenhuma chave privilegiada do Supabase deve ser adicionada ao bundle.

## Desenvolvimento

1. Copie `.env.example` para `.env.local` e informe a URL pública/local da API.
2. Execute `npm install`.
3. Execute `npm run android` ou `npm start`.

Em aparelho físico, `localhost` aponta para o próprio aparelho. Use o IP da máquina na rede local ou uma API de desenvolvimento publicada por HTTPS.

## Validação

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run validate`

## Segurança

- O access token permanece apenas em memória; o refresh token fica no `expo-secure-store`.
- Cache e fila offline são separados por usuário no SQLite.
- Logs nunca devem incluir tokens, senhas ou conteúdo sensível dos registros.
