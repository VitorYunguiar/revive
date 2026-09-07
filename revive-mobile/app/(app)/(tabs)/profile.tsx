import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/features/auth/session-context';
import { cancelDailyCheckIn, isDailyCheckInScheduled, scheduleDailyCheckIn } from '@/core/notifications/reminders';
import { AppButton, Card, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';
import { syncPendingMutations } from '@/core/sync/sync-engine';
import { countPendingMutations } from '@/core/storage/database';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useSession();
  const router = useRouter();
  const [reminders, setReminders] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    void isDailyCheckInScheduled().then(setReminders);
    if (user) void countPendingMutations(user.id).then(setPending);
  }, [user]);

  const toggleReminder = async (enabled: boolean) => {
    try {
      if (enabled) await scheduleDailyCheckIn(20, 0);
      else await cancelDailyCheckIn();
      setReminders(enabled);
    } catch (error) {
      Alert.alert('Lembretes', error instanceof Error ? error.message : 'Não foi possível alterar o lembrete.');
    }
  };

  const logout = async () => {
    const result = await signOut(false);
    if (result.pending > 0) {
      Alert.alert(
        'Alterações pendentes',
        `Existem ${result.pending} alterações ainda não sincronizadas. Deseja descartá-las e sair?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sincronizar e sair', onPress: async () => {
            if (!user) return;
            try {
              await syncPendingMutations(user.id);
              const afterSync = await signOut(false);
              if (afterSync.pending) return Alert.alert('Sincronização pendente', 'Algumas alterações ainda precisam de conexão ou correção.');
              router.replace('/(public)/login');
            } catch (error) {
              Alert.alert('Não foi possível sincronizar', error instanceof Error ? error.message : 'Tente novamente.');
            }
          } },
          { text: 'Descartar e sair', style: 'destructive', onPress: () => void signOut(true).then(() => router.replace('/(public)/login')) },
        ],
      );
      return;
    }
    router.replace('/(public)/login');
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      'Excluir conta e dados?',
      'Esta ação é definitiva e remove hábitos, registros, recaídas, metas e sessões.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir definitivamente', style: 'destructive', onPress: async () => {
          try {
            await deleteAccount();
            router.replace('/(public)/login');
          } catch (error) {
            Alert.alert('Não foi possível excluir', error instanceof Error ? error.message : 'Tente novamente.');
          }
        } },
      ],
    );
  };

  return (
    <Screen>
      <PageTitle title="Perfil" subtitle="Preferências e segurança da sua conta." />
      <AppButton title="Sincronização" variant="secondary" onPress={() => router.push('/(app)/sync')} />
      <Card><Text style={textStyles.heading}>{user?.nome}</Text><Text style={textStyles.muted}>{user?.email}</Text></Card>
      {pending > 0 ? <Card><Text style={textStyles.body}>{pending} alteração(ões) aguardando sincronização.</Text></Card> : null}
      <Card>
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={textStyles.body}>Lembrete diário</Text><Text style={textStyles.muted}>Check-in às 20h, sem conteúdo sensível.</Text></View><Switch value={reminders} onValueChange={(value) => void toggleReminder(value)} trackColor={{ true: colors.primary }} /></View>
      </Card>
      <Card><Text style={textStyles.body}>Se precisar de ajuda imediata, procure um profissional ou serviço de emergência da sua região. O Revive não substitui tratamento médico ou psicológico.</Text></Card>
      <AppButton title="Sair" variant="secondary" onPress={() => void logout()} />
      <AppButton title="Excluir minha conta" variant="danger" onPress={confirmAccountDeletion} />
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md } });
