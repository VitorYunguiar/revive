import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { AppButton, Card, PageTitle, Screen, textStyles } from '@/ui/components';
import { DateCalendar } from '@/ui/date-field';
import { localDateKey as dateKey, displayDate } from '@/domain/formats';

export default function CalendarScreen() {
  const router = useRouter();
  const { data } = useBootstrap();
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const records = data?.registros || [];
  const relapses = data?.recaidas || [];
  const activity = new Set(records.map((record) => record.data_registro));
  relapses.forEach((relapse) => activity.add(dateKey(new Date(relapse.data_recaida))));
  const selectedRecords = records.filter((record) => record.data_registro === selected);
  const selectedRelapses = relapses.filter((relapse) => dateKey(new Date(relapse.data_recaida)) === selected);
  return <Screen>
    <AppButton title="Voltar" variant="secondary" onPress={() => router.back()} />
    <PageTitle title="Calendário" subtitle="Selecione um dia para consultar seus registros." />
    <Card><DateCalendar selected={selected} onSelect={setSelected} activity={activity} /><Text style={textStyles.muted}>Os pontos indicam dias com registros.</Text></Card>
    <Card>
      <Text style={textStyles.heading}>{displayDate(selected)}</Text>
      {!selectedRecords.length && !selectedRelapses.length ? <Text style={textStyles.muted}>Nenhuma atividade registrada neste dia.</Text> : null}
      {selectedRecords.map((record) => <View key={record.id}><Text style={textStyles.body}>Check-in: {record.humor || 'Sem humor informado'}</Text><Text style={textStyles.muted}>{record.observacoes}{record.pending ? ' · Pendente' : ''}</Text></View>)}
      {selectedRelapses.map((relapse) => <View key={relapse.id}><Text style={textStyles.body}>Recaída registrada</Text><Text style={textStyles.muted}>{relapse.motivo}{relapse.pending ? ' · Pendente' : ''}</Text></View>)}
    </Card>
  </Screen>;
}
