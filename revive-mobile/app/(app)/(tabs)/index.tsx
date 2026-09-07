import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { useSession } from '@/features/auth/session-context';
import { completedGoals, formatCurrency, maxStreak, totalSavings } from '@/domain/metrics';
import { Card, EmptyState, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

export default function DashboardScreen() {
  const { user } = useSession();
  const { data, isLoading, error, refetch, isFetching } = useBootstrap();
  if (isLoading && !data) return <Screen scroll={false}><LoadingState label="Preparando sua jornada..." /></Screen>;
  return (
    <Screen>
      <View style={styles.header}>
        <PageTitle title={`Olá, ${user?.nome?.split(' ')[0] || 'você'}`} subtitle="Um dia de cada vez." />
        <Pressable accessibilityLabel="Atualizar dados" onPress={() => void refetch()}><RefreshCw color={colors.primary} size={24} /></Pressable>
      </View>
      {error && !data ? <Card><Text style={{ color: colors.danger }}>{error.message}</Text></Card> : null}
      {data?.mensagem ? <Card><Text style={textStyles.body}>“{data.mensagem.mensagem}”</Text></Card> : null}
      <View style={styles.kpis}>
        <Card style={styles.kpi}><Text style={textStyles.value}>{maxStreak(data?.vicios || [])}</Text><Text style={textStyles.muted}>maior sequência</Text></Card>
        <Card style={styles.kpi}><Text style={textStyles.value}>{formatCurrency(totalSavings(data?.vicios || []))}</Text><Text style={textStyles.muted}>economizados</Text></Card>
        <Card style={styles.kpi}><Text style={textStyles.value}>{completedGoals(data?.metas || [])}</Text><Text style={textStyles.muted}>metas concluídas</Text></Card>
        <Card style={styles.kpi}><Text style={textStyles.value}>{data?.registros.length || 0}</Text><Text style={textStyles.muted}>registros</Text></Card>
      </View>
      <View style={styles.sectionHeader}><Text style={textStyles.heading}>Seus hábitos</Text><Link href="/(app)/habits/new" style={styles.link}>Adicionar</Link></View>
      {!data?.vicios.length ? <EmptyState title="Nenhum hábito cadastrado" body="Adicione o primeiro para acompanhar sua evolução." /> : data.vicios.slice(0, 3).map((habit) => (
        <Link key={habit.id} href={{ pathname: '/(app)/habits/[id]', params: { id: habit.id } }} asChild>
          <Pressable style={styles.habit}>
            <View><Text style={textStyles.heading}>{habit.nome_vicio}</Text><Text style={textStyles.muted}>{habit.tempo_formatado || 'Jornada em andamento'}</Text></View>
            <Text style={textStyles.value}>{habit.dias_abstinencia || 0}d</Text>
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
