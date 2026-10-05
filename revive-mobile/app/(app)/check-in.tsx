import React from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton, Card, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { QuickCheckin } from '@/features/checkin/quick-checkin';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';

/** Session and privacy are enforced by the authenticated layout. Opening never saves. */
export default function CheckinScreen() {
  const router = useRouter();
  const { data, error, refetch } = useBootstrap();
  return <Screen>
    <AppButton title="Voltar à Jornada" variant="secondary" onPress={() => router.replace('/(app)/(tabs)')} />
    <PageTitle title="Check-in" subtitle="Registre como você está hoje." />
    {!data ? error ? <Card>
      <Text style={textStyles.body}>Não foi possível carregar seus hábitos.</Text>
      <AppButton title="Tentar novamente" onPress={() => void refetch()} />
    </Card> : <LoadingState label="Carregando seus hábitos..." /> : <QuickCheckin />}
  </Screen>;
}
