import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { formatCurrency } from '@/domain/metrics';
import { EmptyState, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

export default function HabitsScreen() {
  const { data, isLoading } = useBootstrap();
  if (isLoading && !data) return <Screen scroll={false}><LoadingState /></Screen>;
  return (
    <Screen>
      <View style={styles.header}><PageTitle title="Hábitos" subtitle="Acompanhe cada jornada separadamente." /><Link href="/(app)/habits/new" asChild><Pressable style={styles.add}><Plus color={colors.background} /></Pressable></Link></View>
      {!data?.vicios.length ? <EmptyState title="Nenhum hábito" body="Cadastre o primeiro hábito para começar." /> : data.vicios.map((habit) => (
        <Link key={habit.id} href={{ pathname: '/(app)/habits/[id]', params: { id: habit.id } }} asChild>
          <Pressable style={styles.item}>
            <Text style={textStyles.heading}>{habit.nome_vicio}</Text>
            <Text style={textStyles.body}>{habit.dias_abstinencia || 0} dias • {formatCurrency(habit.valor_economizado)}</Text>
            <Text style={textStyles.muted}>{habit.tempo_formatado}</Text>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  add: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  item: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm },
});
