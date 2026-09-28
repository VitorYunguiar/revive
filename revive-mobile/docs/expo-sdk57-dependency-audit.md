# Auditoria de dependências Expo SDK 57

Revisão em 25/09/2026 para a issue [#15](https://github.com/vitoradriao/revive/issues/15).

## Matriz preservada

A atualização permaneceu no Expo SDK 57 e nas versões já alinhadas do runtime React Native:

- Expo `~57.0.25`, React Native `0.86.3`, React `19.2.3`.
- Reanimated `4.5.1`, Worklets `0.10.1`, Jest Expo `57.0.5`.
- Os módulos Expo usados diretamente ficaram em: `expo-build-properties` 57.0.22, `expo-crypto` 57.0.3, `expo-haptics` 57.0.3, `expo-linking` 57.0.11, `expo-localization` 57.0.2, `expo-notifications` 57.0.21, `expo-print` 57.0.2, `expo-router` 57.0.23, `expo-secure-store` 57.0.4, `expo-sharing` 57.0.22, `expo-splash-screen` 57.0.9, `expo-sqlite` 57.0.3 e `expo-system-ui` 57.0.4. `expo-constants` 57.0.16 e `expo-file-system` 57.0.6 mantêm as faixas declaradas e resolvem versões compatíveis no lock.
- `expo-localization` e `expo-splash-screen` foram declarados como plugins usados pelo `app.config.ts`; `expo-system-ui` foi instalado porque o app configura `userInterfaceStyle: automatic`.

`npx expo install --check` valida que as dependências Expo seguem o SDK. Não use `npm audit fix` para esta árvore: a resolução automática sugere downgrades fora da matriz atual.

## Aviso alcançável em runtime: [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr)

No lock inicial havia 15 avisos moderados. O caminho relevante era `expo-router -> query-string@7.1.3 -> decode-uri-component@0.2.2`. O Router usa `query-string.parse` ao interpretar links recebidos. A advisory do GitHub afeta `decode-uri-component` até `0.4.2`; `0.5.0` contém a correção.

O app substitui somente o decoder aninhado em `query-string` por `0.5.0`. Como `query-string@7` é CommonJS e `decode-uri-component@0.5.0` exporta ESM, `patches/query-string+7.1.3.patch` seleciona a função exportada ou `default`. O `postinstall` aplica o patch de forma reproduzível e o Jest transforma o pacote ESM. O teste `query-string-security.test.ts` cobre percent-encoding malformado dentro do limite aceito.

A entrada de links do sistema em `app/+native-intent.tsx` valida esquema `revive:`, tamanho máximo de 2048 caracteres e rotas permitidas; rejeita caminhos codificados e remove query/hash antes de entregar a rota ao Router. Links de notificação passam por allowlist de três destinos e limite de 128 caracteres. Testes cobrem caminhos permitidos, desconhecidos, grandes e malformados. A correção da dependência protege o decoder; os limites reduzem a entrada exposta antes do parsing.

## Avisos moderados remanescentes

Após a atualização e o override, `npm audit --package-lock-only` reporta 12 moderados, zero altos e zero críticos. Os 12 registros derivam do aviso em `uuid@7.0.3`, carregado por `xcode@3.0.1` através de `@expo/config-plugins` e da cadeia de configuração/build Expo (`@expo/cli`, `@expo/config`, `@expo/prebuild-config`, além de `expo`, `expo-sharing` e `expo-splash-screen`). Eles são dependências de ferramentas de configuração/build, não módulos incluídos no bundle de runtime do app.

A advisory [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) do UUID se refere às funções v3/v5/v6 quando o chamador fornece um buffer. A cadeia `xcode` usa `uuid.v4()` sem buffer. Não foi aplicado override global de `uuid`, pois isso alteraria ferramentas Expo além do caminho afetado e poderia quebrar compatibilidade. Reavaliar esta cadeia na próxima atualização patch disponível do SDK 57 e antes da migração para SDK 58.

## Verificações

- `npx expo install --check`: dependências SDK 57 atualizadas.
- `npx expo-doctor@latest`: 21/21 verificações aprovadas.
- `npm ci`: instalação limpa e aplicação do patch `query-string` pelo `postinstall`.
- `npm run validate`: typecheck, lint, 11 suites/34 testes Jest e teste de migrações SQLite.
- `npm audit --package-lock-only`: 12 moderados, zero altos/críticos; conferir as cadeias descritas acima.
- `npm run android:setup` e `:app:assembleDebug`: build Android debug concluído (395 tarefas). APK instalado e iniciado no emulador `emulator-5554` como `com.reviveapp.revive.dev`; nenhum build release foi gerado.


## Homologação física em 28/09/2026

Build derivado do commit `9a1ef43` (merge da main após os PRs #34–#36): APK `0.1.1-dev`, SHA-256 `D538B761EA3E724B2171746DD27AB6E4CF3D181F9565EA425AF876302D1F9C56`. Instalado em variante de desenvolvimento isolada (`com.reviveapp.revive.dev`) no Moto G52, Android 13/API 33; o aplicativo de produção não foi substituído. API local e PostgreSQL 17 temporários, com migrations do repositório e duas contas sintéticas `.invalid`; nenhum dado ou serviço de produção foi usado.

| Cenário no APK | Resultado observado |
| --- | --- |
| Login e sessão | Entrou com a conta sintética A; a tela mostrou apenas o hábito sintético A, embora a fixture B também existisse. |
| SQLite | Primeiro acesso executou o banco nativo e carregou o snapshot do hábito; teste separado cobriu instalação limpa, reexecução idempotente, fila legada, rollback e reabertura. |
| Lembretes | Permissão Android 13 concedida somente ao pacote Dev; lembrete diário das 20h apareceu no `AlarmManager`; chave desativada após a verificação. |
| Links | `revive:///habits` abriu a lista de hábitos. Sanitização de caminhos desconhecidos, malformados e acima do limite permaneceu coberta pela suíte automatizada. |
| Exportação existente | CSV e JSON abriram o seletor nativo; as duas ações foram canceladas sem escolher destino. O resumo abriu a prévia nativa de impressão em uma página e foi cancelado. |

Validação local no mesmo checkout: `npm run validate` passou (typecheck, lint, 11 suítes/37 testes Jest e verificação SQLite); `npx expo install --check` e Expo Doctor (21/21) passaram; `:app:assembleDebug` concluiu 395 tarefas. `npm audit --json` em 28/09 reportou 12 moderados, nenhum alto ou crítico. São ocorrências duplicadas pela árvore de ferramentas, todas originadas em `uuid@7.0.3` dentro de `xcode@3.0.1`/configuração Expo; a chamada examinada é `uuid.v4()` sem buffer e não usa os métodos vulneráveis v3/v5/v6 com buffer. Sem downgrade, `--force` ou override global. Reavaliar após patch compatível do SDK 57.

**iOS continua explicitamente pendente**: esta homologação é Android; não houve build ou execução nativa iOS nem publicação em loja. A exportação antiga foi exercitada quanto à abertura do seletor, não quanto aos novos critérios de seleção, minimização e ciclo de vida de arquivos da issue #27.
