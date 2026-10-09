# Acompanhamento do roadmap

Estado verificado em **09/10/2026**. #18 e #19 foram integradas e encerradas após o aceite Android; #21 entrou pelo PR #46. A recuperação de senha (#20) foi implementada pelo [PR #45](https://github.com/vitoradriao/revive/pull/45), com aceite externo Westmail/Gmail e Android, conflitos resolvidos e configuração SMTP local. A issue #7 continua como gate mais amplo; SQL remoto e habilitação em produção exigem rollout próprio. As issues são a fonte dos critérios detalhados; o acompanhamento principal permanece na [issue #10](https://github.com/vitoradriao/revive/issues/10).

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
| [#18](https://github.com/vitoradriao/revive/issues/18) | Check-in rápido na Jornada | Concluída no [PR #43](https://github.com/vitoradriao/revive/pull/43); aceite físico no Moto G52 com fila/reinício offline, data civil, TalkBack, viewport menor e isolamento A/B. [Evidências](../revive-mobile/docs/quick-checkin-validation.md). |
| [#19](https://github.com/vitoradriao/revive/issues/19) | Horário de lembrete e abertura direta do check-in | Concluída no [PR #44](https://github.com/vitoradriao/revive/pull/44), integrado em 06/10. Android validou entrega, fuso, cold start/biometria, permissões, troca de conta, upgrade legado e limpeza. [Evidências](../revive-mobile/docs/local-reminders-validation.md). |
| [#21](https://github.com/vitoradriao/revive/issues/21) | Editar e arquivar hábitos preservando histórico e operações pendentes | Concluída pelo [PR #46](https://github.com/vitoradriao/revive/pull/46), integrado em 09/10; CI e PostgreSQL real aprovados. |
| [#20](https://github.com/vitoradriao/revive/issues/20) | Recuperação de senha compatível com a autenticação própria | [PR #45](https://github.com/vitoradriao/revive/pull/45): entrega Westmail/Gmail externa, redefinição e login com nova senha no Moto G52 aprovados; conflitos resolvidos. [Configuração, rollout e evidências](password-recovery.md). |

## Pendências e dependências atuais

| Issue | Entrega | Estado atual |
| --- | --- | --- |
| [#22](https://github.com/vitoradriao/revive/issues/22) | Consultar e corrigir registros completos do diário | Aberta; a #27 depende desta entrega. |
| [#25](https://github.com/vitoradriao/revive/issues/25) | Registrar vontades no mobile e consultar episódios | Aberta; a dependência #24 foi concluída pelo PR #41. |
| [#26](https://github.com/vitoradriao/revive/issues/26) | Resumo semanal verificável | Aberta; depende de #18, #22 e #25, além da #17 já concluída. |
| [#27](https://github.com/vitoradriao/revive/issues/27) | Exportação seletiva e relatório | Aberta. #17 e #21 estão concluídas; faltam #22 e #25. O [mapeamento preparatório no PR #36](https://github.com/vitoradriao/revive/pull/36) continua válido, mas não substitui integração e aceite. |
| [#7](https://github.com/vitoradriao/revive/issues/7) | Homologar Android, atualização, modo offline e privacidade em aparelho físico | Aberta como gate de liberação mais amplo. #18/#19 foram aceitas no Moto G52, mas iOS e os demais itens de distribuição/liberação ainda exigem homologação própria. |

A #24 concluiu a base de dados e o contrato de API de vontades e liberou o trabalho da #25. Ela não conclui a experiência mobile da #25 nem libera o fechamento da #27. O aplicativo não deve ser publicado automaticamente ao concluir essas tarefas.

## Avanço verificado e próxima etapa

O [PR #43](https://github.com/vitoradriao/revive/pull/43) entrou na main em 05/10/2026. O [PR #44](https://github.com/vitoradriao/revive/pull/44) entrou em 06/10 e reúne o lembrete por conta e a correção de orientação após recusa. A validação final passou com tipos, lint, 27 suítes / 123 testes e SQLite real; API, painel, documentação e build web também passaram. A cadeia de desenvolvimento foi atualizada para o watcher nativo do Node e dependências corrigidas; `npm audit` do workspace e do painel ficou em zero vulnerabilidades.

Os testes físicos de 05/10 e 06/10 usaram **Moto G52, Android 13 / API 33**, APK isolado e contas sintéticas no backend de desenvolvimento verificado. As notificações tiveram conteúdo neutro e atraso do SO; o toque aguardou desbloqueio, inclusive após cancelamento, sem salvar registros automaticamente. Logout/exclusão cancelaram os pedidos; outra conta não herdou o lembrete. Uma falha de orientação após recusar permissão foi corrigida e retestada. iOS e a liberação ampla continuam fora do aceite destas duas issues.

O aceite físico de #18 e #19 foi concluído no Moto G52 com contas descartáveis e limpeza posterior. Em 09/10, a #21 entrou na main pelo PR #46. O aceite restante de #20 passou com Westmail, caixa Gmail externa, redefinição pelo aplicativo e login com a nova senha; credenciais anteriores foram recusadas. A integração com a main preserva ambas as funcionalidades. O backend local recebeu configuração SMTP restrita; nenhum SQL remoto foi aplicado e a recuperação permanece desabilitada até o rollout. A próxima história disponível é #22. A #7 mantém o gate final; iOS e os itens de distribuição permanecem pendentes.

As etapas de distribuição, como testes iOS, política de privacidade, página de exclusão e configuração de push remoto, permanecem no [estado da implementação mobile](../revive-mobile/docs/implementation-status.md) e no [checklist de release](../revive-mobile/docs/release-checklist.md).

Para registrar uma nova proposta, use os [modelos de Issue](https://github.com/vitoradriao/revive/issues/new/choose) e siga o [guia de contribuição](../CONTRIBUTING.md).
