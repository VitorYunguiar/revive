import React from 'react';
import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { completedGoals, formatCurrency, maxStreak, moodDistribution, totalSavings } from '@/domain/metrics';
import { AppButton, Card, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { spacing } from '@/ui/theme';
import { shareCsv, shareJson, printSummary } from '@/core/export/reporting';

export default function InsightsScreen() {
  const router = useRouter();
  const { data, isLoading } = useBootstrap();
  if (isLoading && !data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (!data) return <Screen><PageTitle title="Insights" subtitle="Sem dados disponíveis." /></Screen>;
  return (
    <Screen>
      <PageTitle title="Insights" subtitle="Indicadores calculados a partir da sua jornada." />
      <AppButton title="Calendário" variant="secondary" onPress={() => router.push('/(app)/calendar')} />
      <AppButton title="Conquistas" variant="secondary" onPress={() => router.push('/(app)/achievements')} />
      <Card><Text style={textStyles.muted}>Maior sequência</Text><Text style={textStyles.value}>{maxStreak(data.vicios)} dias</Text></Card>
      <Card><Text style={textStyles.muted}>Total economizado</Text><Text style={textStyles.value}>{formatCurrency(totalSavings(data.vicios))}</Text></Card>
      <Card><Text style={textStyles.muted}>Metas concluídas</Text><Text style={textStyles.value}>{completedGoals(data.metas)}</Text></Card>
      <Card><Text style={textStyles.heading}>Distribuição de humor</Text><View style={{ gap: spacing.sm }}>{moodDistribution(data).map(([mood, count]) => <Text key={mood} style={textStyles.body}>{mood}: {count}</Text>)}</View></Card>
      <Card><Text style={textStyles.heading}>Recaídas registradas</Text><Text style={textStyles.value}>{data.recaidas.length}</Text></Card>
      <Card>
        <Text style={textStyles.heading}>Relatórios e dados</Text>
        <Text style={textStyles.muted}>Arquivos exportados podem conter informações pessoais. Compartilhe apenas com quem você confia.</Text>
        <AppButton title="Compartilhar CSV" variant="secondary" onPress={() => void shareCsv(data).catch((error) => Alert.alert('Exportação', error.message))} />
        <AppButton title="Compartilhar JSON" variant="secondary" onPress={() => void shareJson(data).catch((error) => Alert.alert('Exportação', error.message))} />
        <AppButton title="Imprimir resumo" variant="secondary" onPress={() => void printSummary(data).catch((error) => Alert.alert('Relatório', error.message))} />
      </Card>
    </Screen>
  );
}
