# Lembretes locais — issue #19

## Preferência e estado real

O Perfil permite editar hora (00–23) e minuto (00–59), salvar e ativar/desativar o lembrete. Uma conta nova começa às 20:00 com o lembrete desligado. Salvar o horário ou restaurar uma sessão nunca pede permissão. A ativação explícita cria primeiro o canal Android e só então solicita a autorização, quando o sistema permite perguntar novamente.

Cada conta guarda no SecureStore `revive.reminder.v1.<usuario>` um objeto versionado com hora, minuto, ativação, fuso IANA, identificador do agendamento e um marcador opcional de permissão recusada. O marcador preserva a orientação após o diálogo nativo/retorno ao app, sem ativar o lembrete automaticamente quando a autorização é concedida. O switch fica ligado somente depois de consultar o SO e confirmar exatamente um pedido nativo com proprietário, destino e horário correspondentes. Permissão recusada/revogada, canal desativado ou falha de armazenamento/agendamento apresentam orientação e deixam o estado sem confirmação; a preferência desejada e o estado nativo são distintos. Web informa que o recurso está disponível no aplicativo Android/iOS.

As operações nativas são serializadas. Ao substituir o horário, a intenção é persistida antes de cancelar o anterior; o cancelamento é confirmado antes da nova criação. A criação também é conferida no SO. Falha restaura a preferência e tenta recuperar o agendamento anterior, com mensagem explícita; recuperação malsucedida apresenta erro, sem anunciar sucesso. Interrupção do processo após persistir a intenção é reconciliada na próxima restauração/retorno ao primeiro plano. Resposta tardia de agendamento após troca de sessão é cancelada.

## Atualização, contas e privacidade

O identificador global legado `revive.daily_notification_id`, pedidos com a assinatura antiga e notificações apresentadas correspondentes são cancelados. A configuração antiga não é atribuída automaticamente a uma conta: o primeiro uso da nova preferência exige ativação explícita. Preferência malformada cancela o pedido nativo, preserva os bytes para recuperação e exige salvar novamente. A atualização não muda esquema SQLite, cache nem fila offline; não descarta operações pendentes.

Logout confirmado cancela os pedidos e notificações apresentadas antes de limpar a sessão. Se o cancelamento falhar, o logout informa erro e mantém a conta. A confirmação existente para dados offline pendentes continua anterior a essa etapa. A troca de conta também cancela os pedidos antes de autenticar; somente a conta autenticada pode restaurar sua própria preferência. Logout preserva o horário daquela conta para uma próxima entrada; exclusão bem-sucedida remove sua preferência. Expiração de sessão revoga o acesso mesmo se o SO falhar e repete a limpeza sem conta na reconciliação seguinte.

A notificação usa somente **Como você está hoje?** e **Reserve um momento para registrar seu check-in.** Não inclui nomes de hábitos, humor, recaídas ou texto de reflexão. O payload contém tipo versionado, proprietário e a rota literal `/(app)/check-in`, sem ID de hábito. A tela existente valida o bootstrap e os hábitos da sessão. Payload desconhecido, campos extras, destino fora da allowlist ou ação diferente do toque padrão são ignorados.

O toque é capturado na raiz, inclusive em cold start; a navegação fica dentro dos gates de restauração, autenticação e privacidade. Se o app bloquear/entrar em segundo plano durante a leitura nativa, o evento permanece pendente para o retorno/desbloqueio. A sessão é conferida novamente após a leitura. Outro proprietário descarta o evento. A combinação identificador/data de entrega é gravada antes de navegar, mantendo os últimos 16 eventos consumidos; listener e resposta inicial duplicados não abrem duas telas. O evento tratado é removido da resposta inicial nativa e da bandeja. Abrir a tela não cria registro.

## Horário local e limites do SO

O agendamento diário usa hora/minuto locais. Restauração, retorno ao primeiro plano e verificação a cada minuto enquanto o app está ativo comparam o fuso atual; mudança provoca cancelamento/reagendamento. Com o processo fechado, não há observador JavaScript de fuso: reabrir o app reconcilia a preferência. Registros anteriores de check-in não são alterados.

Pedido aceito pelo SO não garante entrega no minuto exato. Economia de bateria, Doze, canal/autorização desativados, encerramento forçado e restrições do fabricante podem atrasar ou impedir a entrega. O app não solicita privilégio de alarme exato. O módulo Android pode usar alarme inexato quando esse privilégio está indisponível. O Perfil informa essa limitação; [referência da API Expo Notifications SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).

## Evidências automatizadas — 05/10/2026

- Agendamento único 20:00 → 08:30, restauração sem duplicata, ordem cancelar/criar, recuperação após falha/interrupção e atualizações rápidas serializadas.
- Ativação explícita, canal antes da permissão, negativa/revogação/canal bloqueado, preferência malformada e alteração de fuso.
- Preferências isoladas A/B, remoção de resposta nativa tardia, limpeza legada, cancelamento antes de autenticar/logout/exclusão e preservação de dados pendentes.
- Cold start aguardando restauração/login/desbloqueio, mudança de gate durante leitura, sessão substituída, consumo persistente, evento duplicado, conta incorreta e rejeição de payloads/destinos desconhecidos.
- Campos de horário acessíveis, limites de entrada, switch sem sucesso falso, edição desligada e cancelamento mesmo com rascunho inválido.

`npm run validate` passou com tipos, lint, 27 suítes / 123 testes e SQLite real (instalação nova, fila legada, rollback/reabertura e versão futura). O verificador de documentação passou com 153 links locais após registrar as evidências de aparelho. Esses testes usam mocks de notificações/SecureStore e não comprovam entrega real.

## Homologação em aparelho

O APK local isolado **Revive Teste 19**, pacote `com.reviveapp.revive.issue19`, usa assinatura de teste e API local com contas/hábitos sintéticos. Não substitui os aplicativos Revive/Revive Dev existentes nem acessa o backend remoto. O teste valida a integração nativa mobile; a API sintética não representa homologação do backend. Cleartext é permitido exclusivamente nesse APK de teste para o endpoint local; o manifesto original é restaurado após o build.

O build ARM64 `assembleRelease` passou; pacote isolado e endpoint local no bundle foram conferidos. APK SHA-256: `09012EA7752EE62A71707715C4F86D8F9FB16F6A565F1F4D2C124E52728836C2`. A versão local 0.1.2 / código 3 veio da configuração existente do workspace; este PR não altera a versão do aplicativo. O aparelho reconectado foi um **Moto G52, Android 13 / API 33**, em 05/10/2026. O APK foi instalado separadamente, sem substituir os apps existentes. As contas A/B e o hábito usados eram exclusivamente sintéticos.

Evidências executadas no Android:

| Cenário | Resultado observado |
| --- | --- |
| Instalação nova | 20:00 desligado, sem diálogo de permissão antes da ativação. |
| Permissão recusada | Switch desligado, sem pedido nativo. O teste revelou que a reconciliação apagava a orientação após o diálogo; o marcador persistido corrigiu isso e o reteste manteve a orientação e o acesso às configurações. Autorizar pelo SO não ativou automaticamente a preferência recusada. |
| Alteração/restauração/desativação | 20:00 → 08:30 com um único pedido nativo; encerramento normal do processo/reabertura preservou 08:30 e um pedido. Desligar removeu o pedido. |
| Permissão revogada enquanto ativo | Reabertura mostrou orientação e switch desligado, com zero pedidos nativos. Após conceder a permissão e retomar, a preferência desejada recuperou exatamente um pedido. |
| Fuso e entrega real | Alteração temporária São Paulo → Manaus, um pedido às 17:43 locais e entrega observada às 17:45:09. De volta a São Paulo, pedido às 18:55 e entrega observada às 18:57:21. O atraso real confirma o limite de pontualidade informado no Perfil. |
| Conteúdo | Nas duas entregas, título/corpo neutros foram conferidos no pedido apresentado pelo SO e na linha do próprio app na bandeja. |
| Cold start e privacidade | Processo encerrado antes da entrega. O toque aguardou a autenticação nativa; cancelar manteve o gate opaco e a árvore de acessibilidade comprimida sem conteúdo privado. Depois da biometria feita pelo usuário, o toque pendente abriu o check-in. |
| Consumo e ausência de gravação | A abertura por notificação manteve zero registros e zero operações pendentes. Uma reabertura normal voltou à Jornada sem consumir novamente o primeiro toque. |
| Logout A → B | Logout removeu todos os pedidos e notificações apresentados do app. B iniciou às 20:00 desligado, sem pedido de A; sua ativação criou um único pedido cujo proprietário era B. |
| Entrega com app aberto | B agendou 19:08; às 19:09:16 a notificação estava apresentada, com o app em primeiro plano. O toque abriu o check-in no mesmo PID, preservando o único registro previamente criado e a fila vazia. |
| Exclusão e retorno à conta A | Excluir B pela interface removeu seu pedido e sua chave de preferência do SecureStore, limpou cache/fila e retornou ao login. A nova entrada em A restaurou 18:55 com um único pedido de A, sem proprietário B. A exclusão de backend usou a fixture local, sem comprovar transação no backend remoto. |

Os horários são observações do aparelho, sem promessa de entrega exata. Ao terminar, o lembrete sintético foi desligado e a sessão encerrada; o SO confirmou zero pedidos e zero notificações apresentados do pacote de teste. A configuração original de fuso (`America/Sao_Paulo`, seleção automática ligada) e a fonte 100% foram conferidas após restauração. Os testes de backend remoto, iOS e atualização física a partir da preferência global legada continuam pendentes; cancelamento legado e recuperação de falhas têm cobertura automatizada, sem alegação de execução física. O aceite integral de #18 continua separado.

Roteiro:

1. Registrar hash do APK, aparelho, Android e fuso. Em instalação nova, confirmar 20:00 desligado e ausência de pedido de permissão antes de ativar.
2. Recusar permissão ao ativar: switch desligado e orientação. Autorizar nas configurações do próprio app e ativar novamente.
3. Alterar 20:00 para 08:30; conferir um único pedido nativo. Encerrar/reabrir e conferir o mesmo horário/pedido. Desligar e verificar cancelamento.
4. Agendar para um minuto próximo e observar entrega real com texto neutro. Tocar com app aberto e com processo encerrado; confirmar check-in e ausência de gravação automática/segunda navegação. Encerramento forçado pelo Android não equivale a encerramento normal do processo: pode suspender alarmes.
5. Habilitar bloqueio local, repetir cold start e cancelar/desbloquear autenticação. Nenhum conteúdo deve aparecer antes da autenticação; o toque pendente abre o check-in após desbloquear.
6. Revogar autorização e retornar ao app: estado sem confirmação e pedido cancelado. Ativar novamente; fazer logout de A, entrar em B e conferir que pedido/destino de A não permanece. Reentrar em A restaura apenas sua preferência.
7. Registrar o fuso original, mudar temporariamente o fuso do aparelho, retornar/reabrir e conferir um pedido no novo horário local. Observar entrega nesse fuso e restaurar a configuração original ao terminar.
8. Conferir exclusão usando somente conta sintética e testar atualização com preferência global legada sem apagar fila pendente. Registrar cada cenário executado ou pendente; iOS exige homologação própria.

A integração final depende também do aceite do [check-in rápido #18](https://github.com/vitoradriao/revive/issues/18). Build bem-sucedido e mocks não encerram os critérios físicos desta issue.
