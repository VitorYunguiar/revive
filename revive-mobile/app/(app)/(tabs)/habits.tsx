import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { currentStreak, formatCurrency, sequenceSavings } from '@/domain/metrics';
import { AppButton, EmptyState, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

export default function HabitsScreen() {
  const { data, isLoading } = useBootstrap();
  const [archived, setArchived] = useState(false);
  const habits = (data?.vicios || []).filter(habit => (habit.ativo === false) === archived);
  if (isLoading && !data) return <Screen scroll={false}><LoadingState /></Screen>;
  return (
    <Screen>
      <View style={styles.header}><PageTitle title="Hábitos" subtitle="Acompanhe cada jornada separadamente." /><Link href="/(app)/habits/new" asChild><Pressable style={styles.add}><Plus color={colors.background} /></Pressable></Link></View>
      <AppButton title={archived ? 'Mostrar hábitos ativos' : 'Mostrar hábitos arquivados'} variant="secondary" onPress={() => setArchived(!archived)} />
      <Text style={textStyles.muted}>{archived ? 'Arquivados: histórico, metas e conquistas preservados.' : 'Hábitos ativos'}</Text>
      {!habits.length ? <EmptyState title={archived ? 'Nenhum hábito arquivado' : 'Nenhum hábito ativo'} body={archived ? 'Os hábitos arquivados aparecerão aqui.' : 'Cadastre ou reative um hábito para começar.'} /> : habits.map((habit) => (
        <Link key={habit.id} href={{ pathname: '/(app)/habits/[id]', params: { id: habit.id } }} asChild>
          <Pressable style={styles.item}>
            <Text style={textStyles.heading}>{habit.nome_vicio}</Text>
            {archived ? <Text style={textStyles.muted}>Arquivado · histórico preservado</Text> : null}
            <Text style={textStyles.body}>{currentStreak(habit).value ?? '—'} dias • {sequenceSavings(habit).value == null ? 'Economia indisponível' : formatCurrency(sequenceSavings(habit).value)}</Text>
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
