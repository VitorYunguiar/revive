import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { AppButton, Card, Field, textStyles } from '@/ui/components';
import { DateField } from '@/ui/date-field';
import { displayDate, localDateKey, parseDate, parseMoney } from '@/domain/formats';
import type { Addiction, UpdateAddictionInput } from '@/domain/types';
import { toUserMessage } from '@/core/api/errors';
import { tokenStore } from '@/core/auth/token-store';
import { reviveApi } from '@/core/api/repositories';
import { updateHabit } from './manage-habit';

export function HabitManagement({ habit, userId }: { habit: Addiction; userId: string }) {
  const router = useRouter();
  const [base, setBase] = useState(habit);
  const [name, setName] = useState(habit.nome_vicio);
  const [value, setValue] = useState(Number(habit.valor_economizado_por_dia || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const [start, setStart] = useState(displayDate(habit.data_inicio.slice(0, 10)));
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const inFlight = useRef(false);
  useEffect(() => NetInfo.addEventListener(state => setOnline(Boolean(state.isConnected && state.isInternetReachable !== false))), []);
  const disabled = busy || !online || !base.revision;
  const run = async (input: UpdateAddictionInput) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const saved = await updateHabit(userId, habit.id, input);
      if (saved) setBase(saved);
      setNotice('Alteração confirmada. O histórico e as metas foram preservados.');
    } catch (caught) { setError(toUserMessage(caught)); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const save = () => {
    const amount = parseMoney(value);
    const date = parseDate(start);
    if (name.trim().length < 2 || name.trim().length > 120) return setError('Use de 2 a 120 caracteres no nome.');
    if (amount === undefined || amount > 99999999.99) return setError('Informe uma economia válida, positiva ou zero, com até duas casas decimais.');
    if (!date || date > localDateKey()) return setError('Informe uma data válida, sem data futura.');
    const input: UpdateAddictionInput = { revision: base.revision!, nome_vicio: name.trim(), valor_economizado_por_dia: amount };
    if (date !== base.data_inicio.slice(0, 10)) input.data_inicio = date;
    void run(input);
  };
  const archive = () => Alert.alert(base.ativo === false ? 'Reativar hábito?' : 'Arquivar hábito?',
    'Histórico, conquistas e metas serão preservados. Arquivar não registra recaída nem reinicia a sequência. Operações pendentes precisam ser sincronizadas ou resolvidas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: base.ativo === false ? 'Reativar' : 'Arquivar', onPress: () => void run({ revision: base.revision!, ativo: base.ativo === false }) },
    ]);
  const reload = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    const generation = tokenStore.getGeneration();
    try {
      if ((await tokenStore.getUser())?.id !== userId) throw new Error('A sessão mudou. Abra o hábito novamente.');
      const fresh = await reviveApi.bootstrap();
      if (!tokenStore.isCurrent(generation) || fresh.usuario.id !== userId) throw new Error('A sessão mudou. Abra o hábito novamente.');
      const updated = fresh.vicios.find(item => item.id === habit.id);
      if (!updated) throw new Error('Hábito não encontrado.');
      setBase(updated); setName(updated.nome_vicio); setStart(displayDate(updated.data_inicio.slice(0, 10)));
      setValue(Number(updated.valor_economizado_por_dia || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setError(''); setNotice('Dados recarregados. Revise antes de salvar.');
    } catch (caught) { setError(toUserMessage(caught)); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <Card>
    <Text style={textStyles.heading}>Gerenciar hábito</Text>
    <Text style={textStyles.body}>{base.ativo === false ? 'Arquivado: consulte o histórico ou reative para novos registros.' : 'Hábito ativo'}</Text>
    <Field label="Nome do hábito" value={name} onChangeText={setName} maxLength={120} editable={!busy} />
    <Field label="Economia diária (R$)" value={value} onChangeText={setValue} keyboardType="decimal-pad" maxLength={16} editable={!busy} hint="O novo valor vale a partir da confirmação. O passado mantém os valores anteriores." />
    {base.inicio_editavel ? <DateField label="Corrigir data de início" value={start} onChangeText={setStart} /> : <Text style={textStyles.muted}>Data de início: {start}. A correção exige ausência de registros, metas, conquistas e alterações de economia.</Text>}
    {!online ? <Text accessibilityLiveRegion="polite" style={textStyles.body}>Conecte-se para editar, arquivar ou reativar. Nenhuma edição será salva offline.</Text> : null}
    {!base.revision ? <Text style={textStyles.muted}>Atualize os dados para habilitar a edição.</Text> : null}
    {error ? <Text accessibilityLiveRegion="polite" style={textStyles.body}>{error}</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={textStyles.body}>{notice}</Text> : null}
    <AppButton title="Salvar alterações" disabled={disabled} loading={busy} onPress={save} />
    <AppButton title={base.ativo === false ? 'Reativar hábito' : 'Arquivar hábito'} variant="secondary" disabled={disabled} onPress={archive} />
    <AppButton title="Recarregar dados da edição" variant="secondary" disabled={busy || !online} onPress={() => void reload()} />
    <AppButton title="Resolver operações pendentes" variant="secondary" disabled={busy} onPress={() => router.push('/(app)/sync')} />
  </Card>;
}
