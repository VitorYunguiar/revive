# Revive Mobile

Aplicativo Expo/React Native do Revive. O cliente se comunica exclusivamente com a API Express existente; nenhuma chave privilegiada do Supabase deve ser adicionada ao bundle.

API de desenvolvimento publicada: `https://revive-beryl.vercel.app/api`.

## APK de teste

[Baixar APK Android](https://expo.dev/artifacts/eas/mZSPfKgPRqC0dgrm5hFNJUZwZwVJEFyWKg6H-dHcHDQ.apk) — build concluído em 07/09/2026. Abra no celular Android para baixar e instalar. Se solicitado, permita que o navegador instale este aplicativo.

O projeto está vinculado a `@reviveapp/revive-mobile`. O perfil `preview` usa a API de desenvolvimento por HTTPS e gera um APK instalável, sem depender do Metro no computador.

Para compilar apenas esta pasta a partir do monorepo, em PowerShell:

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
npx eas-cli build --platform android --profile preview
```

Execute na pasta `revive-mobile`. A assinatura Android é gerenciada pelo EAS. Instale o APK pelo link do build no celular; a instalação física e os testes de modo avião continuam necessários antes de um beta.

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
