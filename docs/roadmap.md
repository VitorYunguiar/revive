# Acompanhamento do roadmap

Estado verificado em **06/10/2026**. O check-in rápido foi integrado pelo PR #43 em 05/10; os lembretes estão implementados no PR #44 em rascunho. Os testes Android de 05/10 avançaram o aceite de ambos, que continuam abertos pelas pendências abaixo. As issues são a fonte dos critérios detalhados; o acompanhamento principal permanece na [issue #10](https://github.com/vitoradriao/revive/issues/10).

## Entregas concluídas

| Issue | Melhoria | Estado e evidência |
| --- | --- | --- |
| [#11](https://github.com/vitoradriao/revive/issues/11) | Atualizar Vite/Vitest e corrigir avisos de segurança da infraestrutura de testes | Concluída; [PR #28](https://github.com/vitoradriao/revive/pull/28) |
| [#6](https://github.com/vitoradriao/revive/issues/6) | Versionar o esquema base do banco e permitir atualização segura de bases existentes | Concluída; [PR #30](https://github.com/vitoradriao/revive/pull/30) |
| [#12](https://github.com/vitoradriao/revive/issues/12) | Validar migrations e integração transacional em PostgreSQL real no CI | Concluída; [PR #31](https://github.com/vitoradriao/revive/pull/31) |
| [#13](https://github.com/vitoradriao/revive/issues/13) | Versionar o esquema SQLite e preservar operações pendentes | Concluída; [PR #32](https://github.com/vitoradriao/revive/pull/32) |
| [#14](https://github.com/vitoradriao/revive/issues/14) | Revogar sessões e isolar contas durante refresh e troca de usuário | Concluída; [PR #33](https://github.com/vitoradriao/revive/pull/33) |
| [#8](https://github.com/vitoradriao/revive/issues/8) | Tornar mutações atômicas e persistir a fila antes do envio | Concluída; CI real aprovado; [PR #34](https://github.com/vitoradriao/revive/pull/34) |
| [#15](https://github.com/vitoradriao/revive/issues/15) | Tratar avisos transitivos do Expo sem quebrar a matriz do SDK 57 | Concluída; [PR #35](https://github.com/vitoradriao/revive/pull/35). A mitigação cobriu 12 alertas moderados da cadeia de build; sem alertas altos/críticos na análise registrada. |
| [#16](https://github.com/vitoradriao/revive/issues/16) | Persistir histórico de sequências, conquistas e economia com migração conservadora | Concluída; issue fechada em 28/09/2026. |
| [#17](https://github.com/vitoradriao/revive/issues/17) | Exibir sequência atual, recorde pessoal e conquistas permanentes no mobile | Concluída; issue fechada em 28/09/2026. |
| [#23](https://github.com/vitoradriao/revive/issues/23) | Adicionar bloqueio local opcional e ocultar conteúdo sensível na prévia do app | Concluída pelo [PR #40](https://github.com/vitoradriao/revive/pull/40); validação física no Moto G52 com Android 13 confirmou autenticação ao voltar do segundo plano e janela segura contra captura. |
| [#24](https://github.com/vitoradriao/revive/issues/24) | Criar entidade de registro de vontade com contrato próprio e índices por período | Concluída pelo [PR #41](https://github.com/vitoradriao/revive/pull/41); CI PostgreSQL 17 aprovou instalação nova, upgrade legado e testes reais da API. |

## Pendências e dependências atuais

| Issue | Entrega | Estado atual |
| --- | --- | --- |
| [#18](https://github.com/vitoradriao/revive/issues/18) | Check-in rápido na Jornada | Implementação integrada pelo [PR #43](https://github.com/vitoradriao/revive/pull/43); issue aberta até concluir o aceite físico. Android validou um hábito, duplo toque sem duplicação, fila local/reconexão e fonte ampliada/teclado. [Evidências e cenários restantes](../revive-mobile/docs/quick-checkin-validation.md). |
| [#19](https://github.com/vitoradriao/revive/issues/19) | Horário de lembrete e abertura direta do check-in | Implementada no [PR #44](https://github.com/vitoradriao/revive/pull/44), em rascunho. Android validou entrega, mudança de fuso, abertura com processo encerrado/ativo, biometria, permissões e isolamento A/B. Integração definitiva aguarda aceite de #18 e resolução da CI. [Evidências e limites](../revive-mobile/docs/local-reminders-validation.md). |
| [#20](https://github.com/vitoradriao/revive/issues/20) | Recuperação de senha compatível com a autenticação própria | Aberta. |
| [#21](https://github.com/vitoradriao/revive/issues/21) | Editar e arquivar hábitos preservando histórico e operações pendentes | Aberta; a #27 depende desta entrega. |
| [#22](https://github.com/vitoradriao/revive/issues/22) | Consultar e corrigir registros completos do diário | Aberta; a #27 depende desta entrega. |
| [#25](https://github.com/vitoradriao/revive/issues/25) | Registrar vontades no mobile e consultar episódios | Aberta; a dependência #24 foi concluída pelo PR #41. |
| [#26](https://github.com/vitoradriao/revive/issues/26) | Resumo semanal verificável | Aberta; depende de #18, #22 e #25, além da #17 já concluída. |
| [#27](https://github.com/vitoradriao/revive/issues/27) | Exportação seletiva e relatório | Aberta. A #17 está concluída; faltam as dependências #21, #22 e #25. O [mapeamento preparatório no PR #36](https://github.com/vitoradriao/revive/pull/36) continua válido, mas não substitui integração e aceite. |
| [#7](https://github.com/vitoradriao/revive/issues/7) | Homologar Android, atualização, modo offline e privacidade em aparelho físico | Aberta como gate de liberação. Os testes parciais de #18/#19 no Moto G52 avançaram a matriz, mas faltam validação integrada, backend remoto no aparelho e upgrade legado. iOS não foi validado. |

A #24 concluiu a base de dados e o contrato de API de vontades e liberou o trabalho da #25. Ela não conclui a experiência mobile da #25 nem libera o fechamento da #27. O aplicativo não deve ser publicado automaticamente ao concluir essas tarefas.

## Avanço verificado e próxima etapa

O [PR #43](https://github.com/vitoradriao/revive/pull/43) entrou na main em 05/10/2026. O [PR #44](https://github.com/vitoradriao/revive/pull/44), commit `0f98c2c`, permanece aberto em rascunho. A validação mobile passou com tipos, lint, 27 suítes / 123 testes e SQLite real; na [CI desse commit](https://github.com/vitoradriao/revive/actions/runs/37380984802), mobile, PostgreSQL 17/API real e Vercel passaram. O job API/painel/documentação parou na auditoria da API, com 6 vulnerabilidades preexistentes (2 moderadas, 4 altas); suas validações posteriores não executaram. Nenhum check foi removido.

Os testes físicos de 05/10 usaram **Moto G52, Android 13 / API 33**, APK isolado e API local com dados sintéticos. As notificações tiveram conteúdo neutro e atraso do SO; o toque aguardou desbloqueio, inclusive após cancelamento, sem salvar registros automaticamente. Logout/exclusão cancelaram os pedidos; outra conta não herdou o lembrete. Uma falha de orientação após recusar permissão foi corrigida e retestada. Isso comprova a integração nativa exercitada, sem substituir homologação do backend remoto.

A próxima etapa na fila é concluir o aceite de #18: cinco/zero hábitos e seleção por conta, campos opcionais no histórico/calendário, falha SQLite no aparelho, reinício offline/modo avião, virada da meia-noite, TalkBack e viewport menor. O comando para reiniciar durante o teste offline foi rejeitado pela revisão automática; a etapa continua pendente. Depois, concluir integração/aceite de #19, incluindo atualização física da preferência global legada e o bloqueio da CI. A #20 é a próxima implementação pendente na ordem original, com dependências #14/#12 concluídas. A #7 mantém o gate final; iOS e backend remoto no aparelho continuam pendentes.

As etapas de distribuição, como testes iOS, política de privacidade, página de exclusão e configuração de push remoto, permanecem no [estado da implementação mobile](../revive-mobile/docs/implementation-status.md) e no [checklist de release](../revive-mobile/docs/release-checklist.md).

Para registrar uma nova proposta, use os [modelos de Issue](https://github.com/vitoradriao/revive/issues/new/choose) e siga o [guia de contribuição](../CONTRIBUTING.md).
