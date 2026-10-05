# Check-in rápido — issue #18

## Fluxo e contrato

O cartão de check-in fica no início da Jornada, antes dos indicadores. Um hábito ativo é selecionado automaticamente; com vários hábitos, o seletor acessível inclui todos, inclusive os que não aparecem nos três cartões da Jornada. A última escolha fica no SecureStore em `revive.checkin.habit.v1.<usuario>`, contendo apenas o ID. Uma escolha removida/arquivada usa o primeiro hábito ativo como alternativa. A exclusão da conta remove a preferência; sair e entrar novamente mantém a escolha daquela conta.

Escolher um humor e tocar em **Salvar check-in** usa o mesmo `record.create` do diário. A reflexão opcional aceita humor livre (100 caracteres), gatilhos/conquistas (500 cada) e observações (1000). Recolher não apaga campos. O detalhe do hábito e o calendário apresentam os campos preservados. Nenhuma operação altera recaídas ou contadores.

`data_registro` é a data civil do aparelho no momento do toque, formada pelos componentes locais, sem conversão por UTC. O payload também contém o timezone IANA do aparelho. Ao retornar ao primeiro plano, a indicação de hoje é atualizada imediatamente; enquanto aberto, verifica mudança de dia/fuso a cada 30 segundos. O envio revalida o dia antes de persistir, independentemente desse intervalo. Registros anteriores mantêm sua data civil original. A ausência de registro é descrita apenas em relação aos dados disponíveis; não significa ausência de atividade no servidor.

Quando há registro de hoje para o hábito, o cartão permite consultar os registros ou escolher explicitamente **Registrar outro check-in**. Não sobrescreve registros e não salva ao abrir uma tela. Um bloqueio síncrono impede duplo toque antes do próximo render. Os campos só são limpos após a confirmação da gravação SQLite. Falhas anteriores mantêm o formulário; erros de rede/cache/sync posteriores retornam um recibo de intenção durável, sem convidar o usuário a criar outra operação. Retry usa a chave original já persistida.

Estados exibidos: **Salvo no aparelho / aguardando sincronização**, **Sincronizado** e **Salvo no aparelho / sincronização falhou**. A falha oferece a tela existente de [recuperação da fila](../app/%28app%29/sync.tsx), que reaproveita a intenção. O recibo consulta a fila a cada dez segundos enquanto a tela está aberta para acompanhar sincronização em segundo plano. Se uma intenção pendente sair da fila, orienta consultar o histórico atualizado: sua ausência isolada pode representar confirmação ou descarte explícito, e não é anunciada como sincronização por si só.

## Entrada navegável

`/(app)/check-in` reutiliza o cartão dentro do layout de sessão e bloqueio de privacidade. O link nativo `revive:///check-in` é permitido; parâmetros/fragmentos são descartados. A allowlist de notificações aceita somente a rota literal, sem ID de hábito ou dados de conta. Abrir/retornar nunca salva automaticamente. O agendamento de horário e a ligação do lembrete a essa entrada continuam na issue #19.

O formulário só usa bootstrap pertencente à sessão atual, filtra hábitos por proprietário e estado ativo e reinicia ao mudar de conta. Uma sessão que muda durante o envio não publica o recibo/cache anterior na nova conta. Esta entrega não muda API, migrations, versão/esquema SQLite, nem limpa intenções pendentes. Instalações novas e atualização legada continuam no caminho existente de [migração SQLite](sqlite-migrations.md).

## Evidências de 05/10/2026

- Testes de interação com um/múltiplos/zero hábitos ativos, quinto hábito, preferência por conta, campos opcionais recolhidos, consulta do registro existente, criação adicional explícita, duplo toque durante persistência, erro SQLite, falha de sync e resposta após troca de sessão.
- Testes do hook de mutação: persistência antes de rede, recibo após falhas de projeção/rede/sync/invalidação, isolamento de sessão e preservação explícita da data/fuso e chave da fila.
- Testes da mudança de dia perto da meia-noite e retorno ao primeiro plano; allowlists rejeitam dados de outra conta no caminho.
- Tipos, lint, Jest e verificação SQLite real executados pelo comando `npm run validate`; resultado final registrado no PR.

Na retomada dos testes, o **Moto G52, Android 13 / API 33**, foi conectado. Foi usado o APK isolado e a API local com contas/hábito sintéticos descritos na [validação de lembretes](local-reminders-validation.md), sem acesso ao backend remoto. O cartão na Jornada e a entrada por notificação foram exercitados com um hábito. A abertura não criou registro; cold start com cancelamento e posterior biometria aguardou o desbloqueio antes de abrir o check-in.

O duplo toque em Salvar, com a conexão do app à API local interrompida, produziu uma operação SQLite pendente e nenhum registro no servidor sintético. A interface anunciou gravação local e falha de sincronização. Ao restabelecer a conexão, a mesma intenção resultou em um registro, fila vazia e cache com um registro. Não foi usado modo avião: somente o encaminhamento ADB do endpoint de teste foi interrompido. O comando para encerrar/reabrir durante essa etapa offline foi rejeitado pela revisão automática; reinício offline permanece pendente.

Com fonte do sistema em 130%, o formulário e Salvar permaneceram acessíveis por rolagem, inclusive com teclado aberto no campo Observações; a fonte foi restaurada para 100%. Isso não substitui TalkBack nem teste em viewport menor. Cinco/zero hábitos, isolamento da seleção A/B, conferência completa dos campos opcionais no histórico/calendário, falha SQLite no aparelho, virada da meia-noite, modo avião/reinício offline, TalkBack e backend remoto **continuam pendentes**. iOS também não foi homologado.

## Roteiro para aceite em aparelho

1. Registrar build/commit, aparelho, SO e ambiente de teste; usar somente contas e reflexões sintéticas.
2. Na Jornada com um hábito, escolher humor e salvar sem digitar. Confirmar histórico e estado sincronizado. Tocar rapidamente duas vezes e confirmar somente um registro.
3. Com cinco hábitos, escolher o quinto; alternar contas e reiniciar o app. Confirmar escolha isolada e desconsideração de hábitos removidos/arquivados. Sem hábitos, abrir o cadastro existente.
4. Preencher todos os campos opcionais, recolher/reabrir e salvar. Conferir textos no histórico e no calendário. Produzir falha local sem apagar dados: campos devem permanecer; restaurar o armazenamento e repetir deliberadamente.
5. Em modo avião, salvar, encerrar e reabrir o app. Confirmar registro pendente, consultável, sem perda de texto; reconectar e verificar uma gravação. Falha de servidor deve oferecer recuperação da mesma chave pela tela de sincronização.
6. Conferir o dia perto da meia-noite e após mudança de fuso/retorno ao primeiro plano. Registros existentes não devem mudar de data nem ser sobrescritos.
7. Em tela pequena e fonte ampliada, verificar rolagem sem corte de nomes/textos e uso com teclado. No TalkBack, conferir hábito/humor selecionados, expansão opcional, salvar desabilitado e anúncio dos estados. Todos os alvos de seleção têm altura mínima de 48.
8. Abrir `revive:///check-in` e a rota de notificação literal com sessão ativa/inativa e bloqueio local. Confirmar login/bloqueio antes de conteúdo; abrir novamente não cria registro. Parâmetros de conta/hábito de terceiros não devem ser aceitos.

Os cenários não registrados nas evidências acima permanecem pendentes; a issue #7 acompanha a homologação integrada.
