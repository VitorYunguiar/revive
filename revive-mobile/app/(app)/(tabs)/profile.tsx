import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/features/auth/session-context';
import { usePrivacyLock } from '@/features/privacy/privacy-lock-provider';
import { ReminderSettings } from '@/features/reminders/reminder-settings';
import { AppButton, Card, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';
import { syncPendingMutations } from '@/core/sync/sync-engine';
import { countPendingMutations } from '@/core/storage/database';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useSession();
  const privacyLock = usePrivacyLock();
  const router = useRouter();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (user) void countPendingMutations(user.id).then(setPending);
  }, [user]);

  const reportLogoutError = (error: unknown) => Alert.alert('Não foi possível sair', error instanceof Error ? error.message : 'Tente novamente.');

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
          { text: 'Descartar e sair', style: 'destructive', onPress: () => void signOut(true).then(() => router.replace('/(public)/login')).catch(reportLogoutError) },
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

  const togglePrivacyLock = async (enabled: boolean) => {
    const result = await privacyLock.setEnabled(enabled);
    if (!result.ok) {
      Alert.alert(enabled ? 'Não foi possível ativar' : 'Bloqueio mantido', result.message);
    }
  };

  return (
    <Screen>
      <PageTitle title="Perfil" subtitle="Preferências e segurança da sua conta." />
      <AppButton title="Sincronização" variant="secondary" onPress={() => router.push('/(app)/sync')} />
      <Card><Text style={textStyles.heading}>{user?.nome}</Text><Text style={textStyles.muted}>{user?.email}</Text></Card>
      {pending > 0 ? <Card><Text style={textStyles.body}>{pending} alteração(ões) aguardando sincronização.</Text></Card> : null}
      <ReminderSettings key={user?.id} />
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={textStyles.body}>Bloqueio do app</Text>
            <Text style={textStyles.muted}>Exige autenticação do aparelho ao abrir o Revive e ao voltar do segundo plano.</Text>
          </View>
          <Switch
            value={privacyLock.isEnabled}
            disabled={privacyLock.isLoading}
            onValueChange={(value) => void togglePrivacyLock(value)}
            accessibilityLabel="Bloqueio do app"
            accessibilityHint="Ative para exigir biometria ou o código de desbloqueio do aparelho ao abrir ou retomar o Revive."
            accessibilityState={{ checked: privacyLock.isEnabled, disabled: privacyLock.isLoading, busy: privacyLock.isLoading }}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <Text style={textStyles.muted}>Oculta a prévia do app enquanto ele está fora de foco. Não criptografa o SQLite, backups ou arquivos exportados.</Text>
      </Card>
      <Card><Text style={textStyles.body}>Se precisar de ajuda imediata, procure um profissional ou serviço de emergência da sua região. O Revive não substitui tratamento médico ou psicológico.</Text></Card>
      <AppButton title="Sair" variant="secondary" onPress={() => void logout().catch(reportLogoutError)} />
      <AppButton title="Excluir minha conta" variant="danger" onPress={confirmAccountDeletion} />
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md } });
