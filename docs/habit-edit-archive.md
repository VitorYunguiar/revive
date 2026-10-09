# Edição e arquivamento de hábitos

Entrega da [issue #21](https://github.com/vitoradriao/revive/issues/21). `ativo` é o único estado de arquivamento: `false` arquiva e `true` reativa, mantendo o mesmo ID. Arquivar não cria recaída, não encerra períodos de abstinência, não conclui metas nem apaga registros, vontades ou conquistas. A exclusão definitiva continua separada e confirmada.

## Contrato

`PATCH /api/v2/vicios/{id}` exige a sessão mobile e um JSON com `revision` inteiro positivo. Campos opcionais: `nome_vicio` (2–120 caracteres), `valor_economizado_por_dia` (número de 0 a 99.999.999,99, até duas casas decimais), `data_inicio` (`AAAA-MM-DD`) e `ativo` (booleano). Campos desconhecidos, requisição sem alteração e tipos incorretos retornam 422. O formulário aceita moeda pt-BR e envia um número.

A revisão é comparada sob lock da linha. Qualquer atualização do hábito, inclusive um reset de contador, aumenta `revision`. Sucesso retorna `{ vicio }`; revisão antiga retorna 409 `REVISAO_CONFLITO`. O formulário preserva o rascunho, oferece recarga explícita e exige que a pessoa revise os valores antes de reenviar. Timeout não equivale a sucesso: recarregar permite confirmar o resultado. Uma repetição após gravação recebe conflito pela revisão, sem duplicar a mudança financeira.

ID inexistente ou de outra conta retorna o mesmo 404. O RPC e as funções auxiliares têm `search_path` vazio e execução somente pelo backend `service_role`; a revisão não substitui o filtro de proprietário.

## Data, economia e histórico

A data segue o contrato legado de início em UTC, sem dia futuro. Pode ser corrigida apenas sem recaídas, diário, vontades, metas, marcos permanentes ou alterações anteriores de economia. A verificação definitiva ocorre no banco, sob o mesmo lock dos novos eventos/concessões; o bootstrap inclui `inicio_editavel` como orientação da interface. A correção permitida ajusta a âncora, o período e o segmento inicial. A operação rejeitada retorna 409 `INICIO_COM_HISTORICO` sem modificar dados.

O trigger da #16 encerra o segmento financeiro anterior no momento da gravação e abre outro com o novo valor. Passar de R$10 para R$20 mantém R$10 nos intervalos passados; não faz backfill nem reprecifica registros. A lista, o bootstrap mobile e a leitura da API legada usam economia calculada pelos segmentos; novas metas guardam o mesmo valor como ponto inicial. Metas existentes mantêm suas bases originais. Cobertura desconhecida permanece indisponível.

Hábitos arquivados saem da Jornada, do check-in, da seleção de nova meta e do indicador de sequência atual. A lista de Hábitos alterna ativos/arquivados; o detalhe arquivado permite consultar histórico, editar e reativar. Recordes, economia acumulada e conquistas históricas incluem arquivados, com escopo indicado. Calendário, metas anteriores e exportações mantêm o histórico. Arquivar não pausa nem reinicia uma sequência: os períodos continuam com a mesma semântica temporal.

## Conexão e fila

Edição, arquivamento e reativação exigem conexão e não entram na fila offline. Antes de editar, o mobile sincroniza a fila, consulta um bootstrap novo e verifica novamente as operações do hábito, incluindo conclusão de suas metas. Uma operação ainda pendente/falha bloqueia a edição e oferece **Resolver operações pendentes**. A reativação isolada de um hábito arquivado permite preservar a fila e desbloquear seu reenvio explícito em Sincronização, sem combinar alterações de nome/data/valor. O processo nunca descarta intenções.

Um lock por conta serializa a criação local de eventos e a edição. Cada etapa verifica a geração da sessão; um retorno da conta anterior não atualiza o cache da nova conta. Eventos novos de um hábito já arquivado no servidor retornam 409 `HABITO_ARQUIVADO`, inclusive para clientes antigos. Um evento não gravado mantém a mesma chave de idempotência e pode ser reenviado após reativar o hábito. Recibos de eventos já gravados continuam reproduzíveis mesmo depois do arquivamento. A revisão e a fila local não podem detectar intenções ainda offline em outro aparelho; essa recuperação permanece explícita.

## Migração e implantação

Aplicar `20261009120000_habit_edit_archive.sql` após as migrations anteriores, depois atualizar a API e o mobile. A migration é transacional e aditiva, inicia `revision` em 1 e preserva IDs/fila. Novos clientes desabilitam edição se o snapshot legado ainda não contém revisão. Durante a implantação, a API mantém bootstrap sem a coluna calculada quando a migration/cache de esquema ainda não a oferece; não oculta erros de permissão ou outras falhas. Não limpar cache/fila para atualizar.

Instalação nova e atualização legada são verificadas pelo CI PostgreSQL. A remoção de conta usa os FKs/cascades existentes; não houve nova tabela de dados de usuário. Para recuperação operacional, corrigir a implantação e reativar pela API com a revisão atual. Não remover os segmentos financeiros nem reconstruir períodos para contornar um conflito. Não aplicar as fixtures em banco compartilhado/produção.

## Validação

- Testes de API: allowlist, nome, tipos, moeda, data inválida/futura e revisão obrigatória.
- PostgreSQL real + HTTP: concorrência de duas edições, ownership, alteração prospectiva R$10→R$20, restrição de início, arquivar/reativar preservando IDs, períodos, diário, recaídas, metas/conquistas e recuperação idempotente de evento rejeitado enquanto arquivado.
- Mobile: formulário pt-BR, rascunho em conflito, desabilitação offline, fila pendente/falha, troca de sessão e preservação da persistência antes do envio.
- Regressão: recorde histórico de arquivado preservado e excluído somente do líder atual; exportação mantém histórico e identifica arquivados; suites API/painel/mobile, build web e SQLite.

Validação local em 09/10/2026: tipos/lint, 30 suítes e 134 testes mobile, SQLite real, API/painel e build web; instalação nova/legada e fluxos HTTP em PostgreSQL 17.6 com PostgREST do CI. Os bancos e contêineres de teste foram descartados. Não houve aplicação de SQL remoto. Homologação física integrada, upgrade de APK, TalkBack e iOS continuam no [gate #7](https://github.com/vitoradriao/revive/issues/7); testes automatizados não substituem essa evidência.
