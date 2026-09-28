# Preparação da exportação seletiva — issue #27

Revisão de 28/09/2026, sobre a main `c203bbe` após o PR #34. Este documento conclui o mapeamento preparatório; não implementa a exportação seletiva nem encerra seu aceite.

## Estado verificado

- [reporting.ts](../src/core/export/reporting.ts) exporta o bootstrap inteiro em JSON, incluindo usuário/e-mail/IDs. O CSV usa colunas fixas e omite gatilhos e conquistas do diário; o relatório contém três indicadores do snapshot atual.
- [Insights](../app/%28app%29/%28tabs%29/insights.tsx) compartilha diretamente, sem seleção ou prévia. Não existe validação da conta durante a geração nem descarte dos arquivos temporários após compartilhar.
- [repositories.ts](../src/core/api/repositories.ts) oferece somente o bootstrap para a coleta desses dados. A [API](../../mobile-api.js) consulta registros e recaídas sem paginação explícita; não comprova que o snapshot contém todo o intervalo.
- [types.ts](../src/domain/types.ts) ainda não define vontades, segmentos históricos de economia ou concessões permanentes. `ativo` é opcional. Não inferir contratos futuros a partir de campos ausentes.

## Dependências e sequência

| Entrega | Estado consultado | Contrato necessário para a exportação | O que já pode avançar |
| --- | --- | --- | --- |
| [#17](https://github.com/vitoradriao/revive/issues/17), depende de [#16](https://github.com/vitoradriao/revive/issues/16) | Aberta | Atual versus recorde, concessões permanentes, economia por segmentos e cobertura histórica | Template e fixtures sintéticas de atual=2/recorde=30, cobertura parcial e valor desconhecido |
| [#22](https://github.com/vitoradriao/revive/issues/22), depende de [#8](https://github.com/vitoradriao/revive/issues/8), integrada pelo [PR #34](https://github.com/vitoradriao/revive/pull/34) | Aberta, fundação atômica disponível | Diário completo, filtro de datas/hábito, paginação estável data+ID e revisão | Interface de coleta paginada e testes de empates/limites, sem declarar o bootstrap completo |
| [#25](https://github.com/vitoradriao/revive/issues/25), depende de [#24](https://github.com/vitoradriao/revive/issues/24) | Aberta | Registro de vontade com tipo próprio, instante/fuso, intensidade e campos opcionais | Seleção genérica de tipos e sanitização; adapter de vontade aguarda contrato real |
| [#21](https://github.com/vitoradriao/revive/issues/21), depende de #16 e #17 | Aberta | Leitura dos arquivados e escopo histórico sem apagar metas/registros | Filtro de status e fixture de hábito arquivado; integração aguarda API |

Ordem: #16 → #17 → #21; #8 → #22; #24 → #25. Após as quatro dependências diretas, integrar e homologar #27. A preparação pode tramitar antes delas em PRs vinculados com `Refs #27`, sem encerramento automático. A fundação de #22 foi liberada; as outras trilhas continuam exigindo seus contratos.

## Etapas independentes prontas para implementação

1. **Seleção e prévia puras.** Modelar hábitos, datas locais inclusivas, fuso IANA, tipos e campos. Campos de texto livre começam desmarcados, inclusive nomes/descrições escritos pelo usuário quando opcionais. Validar intervalo, datas impossíveis e seleção vazia. Não criar arquivo antes da confirmação explícita da prévia.
2. **Projeção por allowlist.** Produzir um objeto de exportação próprio, versionado, sem espalhar o bootstrap. Nunca copiar usuário, e-mail, tokens, sessões, chaves de idempotência, payloads da fila ou IDs de conta. Usar referências locais ao arquivo para relacionar hábitos e linhas. A ausência de seleção deve remover a chave/coluna e o valor de conteúdo, prévia, metadados e nome do arquivo.
3. **Serializadores e fixtures.** CSV UTF-8 com BOM e CRLF, aspas duplicadas e proteção de fórmulas; JSON UTF-8 com esquema; HTML com escaping em todos os valores dinâmicos. Podem ser testados sem rede nem recursos nativos.
4. **Coleta e cobertura.** Definir adapter por tipo que receba usuário interno, seleção, cursor e cancelamento e devolva itens, próximo cursor e cobertura. Em produção, só ligar adapters depois que os endpoints das dependências existirem. Offline ou falha de qualquer página deve bloquear o rótulo “completo”, preservar a seleção e mostrar cobertura parcial/pendências.
5. **Compartilhamento.** Capturar conta e geração da sessão ao iniciar; revalidar após cada operação assíncrona, antes de criar e antes de compartilhar. Invalidar ao trocar/logout. Arquivo de nome neutro e único por tentativa, sem texto pessoal; remover somente quando o seletor do SO tiver terminado, inclusive cancelamento/erro, respeitando a leitura do consumidor. Nunca reutilizar um anexo de outra conta.

As etapas 1–3 podem ser implementadas já. As etapas 4–5 podem receber testes por adapters simulados, mas seu aceite depende da API real e do aparelho. Nenhuma etapa depende de envio automático a contatos ou serviços externos.

## Contrato proposto, sujeito às APIs das dependências

| Elemento | Regra |
| --- | --- |
| Seleção | `habitRefs`, `startDate`, `endDate`, `timeZone`, `recordTypes`, `fields`; IDs de conta apenas no contexto interno, nunca serializados |
| Metadados | `schemaVersion`, instante de geração, seleção autorizada e cobertura (`complete`/`partial`, origem local/servidor, pendências e motivo); nenhum texto desmarcado |
| Contagens | Por tipo e hábito, calculadas da mesma projeção que gera o arquivo; prévia e exportação devem usar o mesmo conjunto capturado |
| Diário | Datas civis `YYYY-MM-DD` comparadas sem conversão UTC; campos e revisão definidos em #22 |
| Recaídas/vontades | Filtrar instantes entre início local e início do dia seguinte ao fim, intervalo semiaberto; calcular limites no fuso selecionado, sem supor dias fixos de 24h |
| Métricas | Mostrar atual/recorde separadamente; economia com regra e cobertura. Dado histórico desconhecido não é zero |
| Arquivados | Consulta preservada, status explícito; incluir somente os hábitos selecionados, independentemente do seletor de check-in |
| CSV | Colunas-base propostas: tipo, referência do hábito, data, fuso, pendência; acrescentar só os campos autorizados. Congelar nomes/unidades após contratos reais |
| JSON | Envelope versionado com metadados e coleções tipadas; nunca exportar `BootstrapData` diretamente |
| Relatório | Seleção, contagens, cobertura e indicadores com definições; quebra de página e campos sensíveis obedecem à mesma projeção |

Paginação deve ter desempate determinístico por ID, detectar cursor repetido e deduplicar pela identidade interna. Se a API não oferecer snapshot/revisão estável durante a coleta, declarar essa limitação; contagem de páginas sozinha não garante consistência sob edição concorrente. Metas sem data devem ter regra explícita na prévia; não inventar datas para enquadrá-las no período.

## Matriz de testes a implementar

| Cenário sintético | Resultado obrigatório |
| --- | --- |
| Dois hábitos, somente um selecionado; arquivado selecionado | Nenhuma linha/campo do outro hábito; histórico arquivado legível |
| Mesmo dia inicial/final; evento à meia-noite; fuso São Paulo e transição DST em outro fuso | Inclusão por dia local correta e sem perda/duplicação nos limites |
| Duas páginas com datas empatadas; página vazia; cursor repetido; falha na última página | Todas as linhas únicas, sem loop; falha nunca rotulada como exportação completa |
| `=`, `+`, `-`, `@`, tab/CR/LF antes de fórmula, aspas e quebra de linha em texto | Célula literal ao abrir em planilha; nenhuma fórmula executável |
| Tags HTML, `&`, aspas e caracteres pt-BR | Texto literal, UTF-8 preservado; nenhum elemento HTML injetado |
| Texto sensível preenchido, mas desmarcado | Sentinela ausente do CSV, JSON, HTML, metadados, prévia e nome do arquivo |
| Atual=2, recorde=30, economia parcial e fila pendente | Conceitos distintos; cobertura e pendências visíveis, sem conceder marco permanente otimista |
| Troca de conta durante coleta, escrita ou abertura do seletor | Cancelar geração antiga; não compartilhar/reativar anexo da conta anterior |
| Compartilhamento cancelado ou falho | Nenhuma confirmação de envio; temporário removido no ciclo seguro |
| Snapshot legado, offline e tipo ainda não suportado | Estado parcial/indisponível explícito; ausência não interpretada como zero |

Fixtures devem usar somente dados sintéticos. Cada cenário precisa de esperado, observado e evidência; a tabela acima é um plano, não uma lista de testes já executados.

## Gate de conclusão

- As quatro dependências diretas precisam estar integradas e seus contratos validados.
- Executar tipos, lint, testes mobile e integração real API/SQL quando afetados.
- Abrir CSV/JSON sintéticos gerados e inspecionar as páginas renderizadas do relatório.
- Exercitar compartilhamento/cancelamento e troca de conta em aparelho, com build/commit e ambiente registrados na [homologação #7](https://github.com/vitoradriao/revive/issues/7).
- Somente então marcar os critérios da [issue #27](https://github.com/vitoradriao/revive/issues/27). Esta preparação não libera o recurso nem publica artefatos de usuários.
