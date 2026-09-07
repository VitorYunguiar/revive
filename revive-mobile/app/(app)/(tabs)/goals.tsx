import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';
import { bootstrapKey, useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { useReviveMutations } from '@/features/mutations/use-revive-mutations';
import { EmptyState, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';
import { reviveApi } from '@/core/api/repositories';
import { queryClient } from '@/core/query/client';
import { useSession } from '@/features/auth/session-context';

export default function GoalsScreen() {
  const { data, isLoading } = useBootstrap();
  const { completeGoal } = useReviveMutations();
  const { user } = useSession();
  const removeGoal = (id: string) => Alert.alert('Excluir meta?', 'Esta ação exige conexão.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      if (!(await NetInfo.fetch()).isConnected) return Alert.alert('Sem conexão', 'Conecte-se para excluir a meta.');
      try {
        await reviveApi.deleteGoal(id);
        if (user) await queryClient.invalidateQueries({ queryKey: bootstrapKey(user.id) });
      } catch (error) { Alert.alert('Não foi possível excluir', error instanceof Error ? error.message : 'Tente novamente.'); }
    } },
  ]);
  if (isLoading && !data) return <Screen scroll={false}><LoadingState /></Screen>;
  return (
    <Screen>
      <View style={styles.header}><PageTitle title="Metas" subtitle="Transforme progresso em objetivos alcançáveis." /><Link href="/(app)/goals/new" asChild><Pressable style={styles.add}><Plus color={colors.background} /></Pressable></Link></View>
      {!data?.metas.length ? <EmptyState title="Nenhuma meta" body="Crie uma meta ligada a um dos seus hábitos." /> : data.metas.map((goal) => (
        <View key={goal.id} style={[styles.item, goal.concluida && styles.done]}>
          <View style={{ flex: 1, gap: spacing.xs }}><Text style={textStyles.heading}>{goal.descricao_meta}</Text><Text style={textStyles.muted}>{goal.vicios?.nome_vicio || 'Meta pessoal'}</Text></View>
          {!goal.concluida && !goal.pending ? <Pressable accessibilityLabel="Concluir meta" onPress={() => void completeGoal(goal.id).catch((error) => Alert.alert('Não foi possível concluir', error instanceof Error ? error.message : 'Tente novamente.'))} style={styles.check}><Check color={colors.background} /></Pressable> : goal.concluida ? <Check color={colors.success} /> : <Text style={textStyles.muted}>Pendente</Text>}
          {!goal.pending ? <Pressable accessibilityLabel="Excluir meta" onPress={() => removeGoal(goal.id)}><Trash2 color={colors.danger} /></Pressable> : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  add: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  item: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  done: { opacity: 0.65 },
  check: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
