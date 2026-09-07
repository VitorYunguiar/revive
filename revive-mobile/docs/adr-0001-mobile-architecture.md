# ADR 0001 — Arquitetura mobile do Revive

Status: aceita em 28/08/2026.

## Decisão

O aplicativo usa Expo/React Native com TypeScript, Expo Router e uma API Express como único gateway de dados. O bundle mobile não acessa o Supabase diretamente e nunca recebe uma chave privilegiada.

Estado remoto é gerenciado pelo TanStack Query. O refresh token fica no SecureStore e o access token de 15 minutos permanece apenas em memória. SQLite guarda snapshots separados por usuário e uma fila persistente de mutações idempotentes.

## Consequências

- A interface web não é importada; regras puras e contratos podem ser compartilhados depois de testes de paridade.
- Android e iOS usam a mesma base.
- Check-ins, recaídas e metas podem ser registrados offline e repetidos com segurança.
- Mudanças de contrato mobile entram em `/api/v2`; endpoints web atuais permanecem compatíveis.
- Builds de produção exigem API HTTPS. Identificadores das lojas permanecem pendentes de decisão do proprietário.

## Limites de segurança

- `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` e segredos equivalentes existem somente no servidor.
- Logs não devem registrar tokens, senhas, textos de diário ou motivos de recaída.
- A migration habilita RLS e remove grants públicos das tabelas de sessão, idempotência e dispositivos.
- Exclusão de conta é executada por uma função transacional sem permissão para `anon` ou `authenticated`.
