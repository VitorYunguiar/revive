# Lembretes locais — issue #19

## Preferência e estado real

O Perfil permite editar hora (00–23) e minuto (00–59), salvar e ativar/desativar o lembrete. Uma conta nova começa às 20:00 com o lembrete desligado. Salvar o horário ou restaurar uma sessão nunca pede permissão. A ativação explícita cria primeiro o canal Android e só então solicita a autorização, quando o sistema permite perguntar novamente.

Cada conta guarda no SecureStore `revive.reminder.v1.<usuario>` um objeto versionado com hora, minuto, ativação, fuso IANA e identificador do agendamento. O switch fica ligado somente depois de consultar o SO e confirmar exatamente um pedido nativo com proprietário, destino e horário correspondentes. Permissão recusada/revogada, canal desativado ou falha de armazenamento/agendamento apresentam orientação e deixam o estado sem confirmação; a preferência desejada e o estado nativo são distintos. Web informa que o recurso está disponível no aplicativo Android/iOS.

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

`npm run validate` passou com tipos, lint, 27 suítes / 123 testes e SQLite real (instalação nova, fila legada, rollback/reabertura e versão futura). O verificador de documentação passou com 152 links locais. Esses testes usam mocks de notificações/SecureStore e não comprovam entrega real.

## Homologação em aparelho

O APK local isolado **Revive Teste19**, pacote `com.reviveapp.revive.issue19`, usa assinatura de teste e API local com contas/hábitos sintéticos. Não substitui os aplicativos Revive/Revive Dev existentes nem acessa o backend remoto. O teste valida a integração nativa mobile; a API sintética não representa homologação do backend. Cleartext é permitido exclusivamente nesse APK de teste para o endpoint local; o manifesto original é restaurado após o build.

O build ARM64 `assembleRelease` passou; pacote isolado e endpoint local no bundle foram conferidos. APK SHA-256: `3BD5D059B0FC4BB3C172A4FFF1A92A2D11F8C940AF742ED183F00CE89D1B933E`. A versão local 0.1.2 / código 3 veio da configuração existente do workspace; este PR não altera a versão do aplicativo. O aparelho apareceu temporariamente, mas os últimos comandos `adb devices -l` não encontraram conexão. Instalação, entrega, mudança real de fuso, cold start e interação com biometria **ainda não foram executados**. iOS também permanece sem homologação.

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
