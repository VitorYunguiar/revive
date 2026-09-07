import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { AppButton, Card, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors } from '@/ui/theme';

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function CalendarScreen() {
  const router = useRouter();
  const { data } = useBootstrap();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const records = data?.registros || [];
  const relapses = data?.recaidas || [];
  const activity = new Set(records.map((record) => record.data_registro));
  relapses.forEach((relapse) => activity.add(dateKey(new Date(relapse.data_recaida))));
  const days = Array.from({ length: month.getDay() + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, i) => i < month.getDay() ? null : new Date(month.getFullYear(), month.getMonth(), i - month.getDay() + 1));
  const selectedRecords = records.filter((record) => record.data_registro === selected);
  const selectedRelapses = relapses.filter((relapse) => dateKey(new Date(relapse.data_recaida)) === selected);
  return <Screen>
    <AppButton title="Voltar" variant="secondary" onPress={() => router.back()} />
    <PageTitle title="Calendário" subtitle="Selecione um dia para consultar seus registros." />
    <Text style={textStyles.heading}>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
    <AppButton title="Mês anterior" variant="secondary" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
    <AppButton title="Próximo mês" variant="secondary" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <Text key={day} style={[textStyles.muted, { width: '14.28%', textAlign: 'center' }]}>{day}</Text>)}
      {days.map((day, i) => day ? <Pressable key={dateKey(day)} accessibilityRole="button" accessibilityLabel={`${day.toLocaleDateString('pt-BR')}${activity.has(dateKey(day)) ? ', com atividade' : ''}`} accessibilityState={{ selected: selected === dateKey(day) }} onPress={() => setSelected(dateKey(day))} style={{ width: '14.28%', minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: selected === dateKey(day) ? colors.surfaceRaised : 'transparent' }}>
        <Text style={textStyles.body}>{day.getDate()}</Text><Text style={{ color: colors.primary }}>{activity.has(dateKey(day)) ? '●' : ' '}</Text>
      </Pressable> : <View key={`blank-${i}`} style={{ width: '14.28%' }} />)}
    </View>
    <Card>
      <Text style={textStyles.heading}>{selected}</Text>
      {!selectedRecords.length && !selectedRelapses.length ? <Text style={textStyles.muted}>Nenhuma atividade registrada neste dia.</Text> : null}
      {selectedRecords.map((record) => <View key={record.id}><Text style={textStyles.body}>Check-in: {record.humor || 'Sem humor informado'}</Text><Text style={textStyles.muted}>{record.observacoes}{record.pending ? ' · Pendente' : ''}</Text></View>)}
      {selectedRelapses.map((relapse) => <View key={relapse.id}><Text style={textStyles.body}>Recaída registrada</Text><Text style={textStyles.muted}>{relapse.motivo}{relapse.pending ? ' · Pendente' : ''}</Text></View>)}
    </Card>
  </Screen>;
}
