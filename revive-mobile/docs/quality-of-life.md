# Melhorias de preenchimento — 08/09/2026

Versão Android 0.1.1, código 2.

- Novo hábito: data digitável com máscara DD/MM/AAAA, aceita colagem ISO, calendário no tema escuro/verde, navegação por mês e ano, atalho Hoje e confirmação antes de aplicar. Cancelar mantém o valor anterior. Datas impossíveis e futuras são rejeitadas; a API continua recebendo YYYY-MM-DD.
- Dinheiro: aceita vírgula e ponto decimal, valores brasileiros colados, formatação com duas casas ao sair do campo. Economia diária pode ficar vazia (zero). Valores negativos ou inválidos são rejeitados.
- Metas: exige pelo menos um objetivo válido, dias inteiros positivos ou dinheiro maior que zero. Seleciona o primeiro hábito após carregar os dados e oferece criação de hábito quando a lista está vazia. Alternância de início hoje não possui mais dois eventos de toque sobrepostos.
- Campos compartilhados: destaque de foco, mostrar/ocultar senha, dicas, contadores em textos longos e acomodação do teclado. Login/cadastro têm preenchimento automático e navegação pelo teclado.
- Check-in: atalhos de humor com seleção acessível, mantendo texto livre; limites visíveis nas reflexões. Histórico usa datas brasileiras e reutiliza o calendário com pontos de atividade.

## Evidências

- `npm run validate`: tipos e lint sem erros; 7 suítes, 21 testes passando.
- Novos testes cobrem máscara, colagem, exclusão, ano bissexto, datas impossíveis, conversão monetária, cancelamento e confirmação do calendário, seleção de ano/mês, bloqueio de futuro e visibilidade de senha.
- O teste do formulário verifica o payload enviado à API (`29/02/2024` → `2024-02-29`, `1.234,56` → `1234.56`) e impede envio de entradas inválidas, com repositório simulado.
- Prévia temporária dos componentes React Native Web inspecionada em 390×844 e 320×640; seleção de 07/09/2026 confirmada visualmente. A rota de prévia foi removida antes do pacote Android.
- Capturas locais em `output/calendar-qol.png` e `output/form-qol-small.png` (ignoradas pelo Git).
- A prévia isolou os componentes: o login completo no navegador depende de suporte web para SecureStore, que este aplicativo nativo ainda não implementa. Não equivale a um teste autenticado nem em aparelho físico.

## Distribuição

- Atualização em 09/09/2026: APK local 0.1.1 (2) gerado com sucesso em `output/revive-local.apk`, com a mesma assinatura do EAS. Inclui estas melhorias. Consulte `android-local.md` para gerar versões sem a fila do Expo.

- Build Android enviado em 08/09/2026: `06adf98f-8cca-4599-972f-e9b6e83994bd`, perfil preview, versão 0.1.1 (2), assinatura remota existente.
- Último estado consultado: `IN_QUEUE`. APK ainda não disponível nessa consulta.
- Acompanhar: https://expo.dev/accounts/reviveapp/projects/revive-mobile/builds/06adf98f-8cca-4599-972f-e9b6e83994bd
- O APK anterior 0.1.0 não contém estas melhorias; esta versão requer nova instalação/atualização do APK (não há expo-updates configurado).
