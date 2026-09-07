# Validação do Supabase de desenvolvimento

Data: 06/09/2026, com operações após 00:00 UTC de 07/09.
Projeto: `upqlaeqdaobzrepamnvs`, confirmado pelo usuário como desenvolvimento.

## Alterações aplicadas

| Arquivo local em `supabase/migrations` | Versão registrada pelo MCP |
| --- | --- |
| `20260616000000_add_goal_progress_baseline.sql` | `20260907002638` |
| `20260828223303_mobile_sessions_and_idempotency.sql` | `20260907002647` |
| `20260907002648_mobile_bootstrap_author.sql` | `20260907002715` |
| `20260907002650_restrict_revive_tables_to_api.sql` | `20260907004608` |
| `20260907004754_harden_modification_trigger_search_path.sql` | `20260907004806` |

O MCP gera versões no momento da aplicação. Antes de usar `supabase db push`, reconciliar esses identificadores com o histórico remoto; não reaplicar cegamente os arquivos por diferença de timestamp.

- Quatro campos de baseline de metas confirmados no catálogo remoto.
- `app_sessions`, `api_idempotency` e `device_push_tokens` criadas com RLS, sem SELECT para `anon`/`authenticated` e com INSERT para `service_role`.
- `delete_revive_account(uuid)` usa SECURITY INVOKER, search_path vazio e execução apenas pelo servidor entre os papéis da API auditados. As FKs de registros, recaídas e marcos usam cascade; a FK de metas para vícios usa set null.
- Adicionada coluna opcional `mensagens_motivacionais.autor`, exigida pela consulta do bootstrap e ausente no schema original.

## Verificação

- API: 16 testes passaram (5 unitários e 11 de integração).
- Mobile: TypeScript, lint e 12 testes passaram.
- Consultas ao catálogo confirmaram colunas, RLS e permissões; histórico remoto lista as cinco migrations.
- A primeira tentativa de teste transacional por `execute_sql` foi bloqueada por modo somente leitura. Depois da configuração da chave de servidor, a validação foi realizada pela API Express real usando Supertest e Supabase, sem mocks do banco.
- `scripts/verify-mobile-development.cjs` passou em seis grupos: cadastro/login de duas contas; bootstrap e isolamento; replay sequencial e conflito de idempotência; metas e recaída; dispositivos/refresh/logout; exclusão de contas com verificação da limpeza de todas as dependências, incluindo marcos, sessões e idempotência.
- O teste usa contas descartáveis e limpeza em finally, restrito ao projeto de desenvolvimento. Executar na raiz com `REVIVE_VERIFY_DEVELOPMENT=1` no ambiente. Chaves e tokens não são impressos.
- As dez tabelas públicas têm RLS e não concedem SELECT a anon/authenticated; service_role mantém acesso. O isolamento entre usuários é responsabilidade da API Express, que emite seus próprios JWTs.
- Auditoria de segurança final: zero ERROR/WARN, apenas dez INFO de RLS sem políticas, esperados pelo acesso exclusivo via backend.
- O `.env` está ignorado pelo Git; nenhum segredo foi adicionado aos arquivos de teste ou documentação.

## Pendências

- Chave de servidor configurada e verificada localmente. Servidores já em execução precisam recarregar o ambiente; validar configuração de qualquer API hospedada separadamente.
- Restrição das sete tabelas antigas aplicada após confirmar acesso da chave de servidor. Não promover a outros ambientes antes de configurar a API correspondente.
- Search_path da função `atualizar_data_modificacao()` corrigido após inspeção: o corpo somente atribui NOW() a NEW.data_atualizacao.
- Atomicidade das mutações offline, concorrência/revogação de sessões e teste em aparelho continuam pendentes conforme o documento de implementação.

Os testes de replay sequencial não comprovam atomicidade sob falha ou concorrência, nem revogação imediata de access tokens. Esses itens permanecem no backlog.

Referência do advisor informativo: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
