# Histórico de progresso v2

O bootstrap v2 preserva `dias_abstinencia`, `valor_economizado` e os demais campos legados. Cada vício também recebe `progresso`, que separa a sequência atual, o recorde histórico, os dias distintos com check-in, a economia estimada da sequência, a estimativa acumulada e os marcos já reconhecidos.

## Regras de cálculo

- Um dia completo corresponde a 24 horas decorridas. Os timestamps sem fuso que já existiam no PostgreSQL são interpretados como UTC; datas de check-in continuam sendo datas civis, sem conversão de fuso.
- A sequência atual começa na âncora confirmada do hábito ou no reinício mais recente. Uma recaída marcada `resetar_contador: false` fica no diário, mas não encerra uma sequência. Eventos com o mesmo instante têm ordenação estável pelo UUID; eventos retroativos recompõem a linha do tempo na mesma transação.
- O recorde é o maior período identificável. A cobertura acompanha o período que sustenta o número. Registros legados sem intenção de reinício podem tornar a continuidade `unknown`, caso em que o snapshot omite o número em vez de adivinhar.
- Check-ins contam datas distintas, não linhas. Datas ausentes não contam como abstinência nem como check-in.
- A economia é estimativa, não saldo. Só soma dias completos da sequência e respeita cada trecho de valor diário. Alterações futuras fecham o trecho anterior; elas não recalculam o passado. O valor e a cobertura são nulos/desconhecidos quando há uma lacuna sem taxa utilizável.
- `confirmed` identifica períodos registrados por uma âncora ou reinício explícito; `inferred` identifica informação legada preservada como estimativa; `unknown` significa que os dados não permitem sustentar o número.
- `awarded_at` é o instante de reconhecimento. Marcos legados usam a data que estava salva em `marcos`; marcos reconhecidos por leitura podem registrar o instante da observação quando a data histórica não é demonstrável. A unicidade por escopo impede duplicação em retries.

## Migração e recuperação

A migração é aditiva. Instalações existentes conservam IDs, recaídas, marcos e taxas. Linhas antigas de recaída recebem `resetar_contador = NULL`, sem inferir intenção. Uma recaída nova exige a decisão booleana do cliente. `progresso_ancoras`, `progresso_periodos`, `segmentos_economia` e `conquistas_permanentes` são removidas pela exclusão de conta junto com o vício ou usuário relacionado. Os testes de upgrade sintético validam a repetição do backfill e a cascata dentro de transação revertida.

O snapshot offline anterior continua legível e conserva seus valores compatíveis; ele não transforma um progresso pendente em marco permanente. O servidor é a fonte dos marcos persistidos.
