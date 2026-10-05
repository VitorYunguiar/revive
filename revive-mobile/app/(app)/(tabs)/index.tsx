import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { useSession } from '@/features/auth/session-context';
import { accountAccumulatedSavings, accountRecordHolder, completedGoals, coverageLabel, currentStreak, distinctCheckinDays, formatCurrency } from '@/domain/metrics';
import { Card, EmptyState, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';
import { QuickCheckin } from '@/features/checkin/quick-checkin';

export default function DashboardScreen() {
  const { user } = useSession();
  const { data, isLoading, error, refetch, isFetching } = useBootstrap();
  const recordHolder = accountRecordHolder(data?.vicios || []);
  const savings = accountAccumulatedSavings(data?.vicios || []);
  const hasPendingProgress = Boolean(data?.vicios.some((habit) => habit.progresso?.pendente));
  if (isLoading && !data) return <Screen scroll={false}><LoadingState label="Preparando sua jornada..." /></Screen>;
  return (
    <Screen>
      <View style={styles.header}>
        <PageTitle title={`Olá, ${user?.nome?.split(' ')[0] || 'você'}`} subtitle="Um dia de cada vez." />
        <Pressable accessibilityLabel="Atualizar dados" onPress={() => void refetch()}><RefreshCw color={colors.primary} size={24} /></Pressable>
      </View>
      {error && !data ? <Card><Text style={{ color: colors.danger }}>{error.message}</Text></Card> : null}
      <QuickCheckin />
      {data?.mensagem ? <Card><Text style={textStyles.body}>“{data.mensagem.mensagem}”</Text></Card> : null}
      {hasPendingProgress ? <Card><Text accessibilityLiveRegion="polite" style={textStyles.body}>Há uma atualização de progresso aguardando sincronização. Recordes e conquistas mostram apenas dados já salvos.</Text></Card> : null}
      <View style={styles.kpis}>
        <Card style={styles.kpi}>
          <Text accessibilityLabel={recordHolder?.progresso?.recorde_dias == null ? 'Recorde histórico indisponível' : `Recorde histórico: ${recordHolder.progresso.recorde_dias} dias`} style={textStyles.value}>{recordHolder?.progresso?.recorde_dias ?? '—'}</Text>
          <Text style={textStyles.muted}>dias de recorde</Text>
          <Text style={textStyles.muted}>{recordHolder?.nome_vicio || 'Histórico parcial ou sem hábitos'}</Text>
        </Card>
        <Card style={styles.kpi}>
          <Text accessibilityLabel={savings.value == null ? 'Economia acumulada indisponível' : `Economia estimada acumulada: ${formatCurrency(savings.value)}`} style={textStyles.value}>{savings.value == null ? '—' : formatCurrency(savings.value)}</Text>
          <Text style={textStyles.muted}>economia estimada acumulada</Text>
          <Text style={textStyles.muted}>{coverageLabel(savings.coverage)}</Text>
        </Card>
        <Card style={styles.kpi}><Text style={textStyles.value}>{completedGoals(data?.metas || [])}</Text><Text style={textStyles.muted}>metas concluídas</Text></Card>
        <Card style={styles.kpi}><Text style={textStyles.value}>{distinctCheckinDays(data?.registros || [])}</Text><Text style={textStyles.muted}>dias distintos com check-in</Text></Card>
      </View>
      <View style={styles.sectionHeader}><Text style={textStyles.heading}>Seus hábitos</Text><Link href="/(app)/habits/new" style={styles.link}>Adicionar</Link></View>
      {!data?.vicios.length ? <EmptyState title="Nenhum hábito cadastrado" body="Adicione o primeiro para acompanhar sua evolução." /> : data.vicios.slice(0, 3).map((habit) => (
        <Link key={habit.id} href={{ pathname: '/(app)/habits/[id]', params: { id: habit.id } }} asChild>
          <Pressable style={styles.habit}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={textStyles.heading}>{habit.nome_vicio}</Text>
              <Text style={textStyles.muted}>Atual: {currentStreak(habit).value == null ? 'indisponível' : `${currentStreak(habit).value} dias`}{habit.progresso?.pendente ? ' · pendente de sincronização' : currentStreak(habit).legacy ? ' · dado legado' : ''}</Text>
              <Text style={textStyles.muted}>Recorde: {habit.progresso?.recorde_dias == null || habit.progresso.recorde_cobertura === 'unknown' ? 'indisponível' : `${habit.progresso.recorde_dias} dias (${coverageLabel(habit.progresso.recorde_cobertura)})`}</Text>
            </View>
            <Text accessibilityLabel={`Sequência atual: ${currentStreak(habit).value == null ? 'indisponível' : `${currentStreak(habit).value} dias`}`} style={textStyles.value}>{currentStreak(habit).value ?? '—'}d</Text>
          </Pressable>
        </Link>
      ))}
      {isFetching ? <Text style={textStyles.muted}>Sincronizando...</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpi: { width: '48%', minHeight: 120 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '800' },
  habit: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
