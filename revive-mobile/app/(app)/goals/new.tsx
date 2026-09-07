import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { useReviveMutations } from '@/features/mutations/use-revive-mutations';
import { toUserMessage } from '@/core/api/errors';
import { AppButton, Card, Field, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

const schema = z.object({ description: z.string().trim().min(2, 'Descreva a meta.'), days: z.string(), value: z.string(), startToday: z.boolean() });
type Form = z.infer<typeof schema>;
const todayLocal = () => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export default function NewGoalScreen() {
  const router = useRouter();
  const { data } = useBootstrap();
  const { createGoal } = useReviveMutations();
  const [habitId, setHabitId] = useState(data?.vicios[0]?.id || '');
  const [error, setError] = useState('');
  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { description: '', days: '', value: '', startToday: true } });
  const startToday = useWatch({ control, name: 'startToday' });
  const submit = handleSubmit(async (values) => {
    if (!habitId) return setError('Selecione um hábito.');
    try {
      await createGoal({ vicio_id: habitId, descricao_meta: values.description, dias_objetivo: values.days ? Number(values.days) : undefined, valor_objetivo: values.value ? Number(values.value.replace(',', '.')) : undefined, iniciar_hoje: values.startToday, data_inicio_meta: values.startToday ? todayLocal() : null });
      router.back();
    } catch (caught) { setError(toUserMessage(caught)); }
  });
  return (
    <Screen>
      <PageTitle title="Nova meta" subtitle="Escolha a jornada e um objetivo em dias ou valor." />
      <Card>
        <Text style={textStyles.body}>Hábito</Text>
        {data?.vicios.map((habit) => <Pressable key={habit.id} onPress={() => setHabitId(habit.id)} style={[styles.choice, habitId === habit.id && styles.choiceActive]}><Text style={textStyles.body}>{habit.nome_vicio}</Text></Pressable>)}
        <Controller control={control} name="description" render={({ field }) => <Field label="Descrição" value={field.value} onChangeText={field.onChange} error={errors.description?.message} />} />
        <Controller control={control} name="days" render={({ field }) => <Field label="Objetivo em dias (opcional)" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />} />
        <Controller control={control} name="value" render={({ field }) => <Field label="Objetivo em valor (opcional)" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />} />
        <Pressable style={styles.switchRow} onPress={() => setValue('startToday', !startToday)}><Text style={textStyles.body}>Contar progresso a partir de hoje</Text><Switch value={startToday} onValueChange={(value) => setValue('startToday', value)} /></Pressable>
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        <AppButton title={isSubmitting ? 'Salvando...' : 'Criar meta'} disabled={isSubmitting} onPress={submit} />
        <AppButton title="Cancelar" variant="secondary" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  choice: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  choiceActive: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
