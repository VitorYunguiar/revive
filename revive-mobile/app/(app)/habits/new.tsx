import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { reviveApi } from '@/core/api/repositories';
import { toUserMessage } from '@/core/api/errors';
import { queryClient } from '@/core/query/client';
import { useSession } from '@/features/auth/session-context';
import { bootstrapKey } from '@/features/bootstrap/use-bootstrap';
import { AppButton, Card, Field, PageTitle, Screen } from '@/ui/components';
import { colors } from '@/ui/theme';

const schema = z.object({
  name: z.string().trim().min(2, 'Informe o hábito.'),
  startDate: z.iso.date('Use a data no formato AAAA-MM-DD.'),
  dailyValue: z.string().trim().refine((value) => !Number.isNaN(Number(value.replace(',', '.'))), 'Informe um valor válido.'),
});
type Form = z.infer<typeof schema>;
const todayLocal = () => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export default function NewHabitScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [error, setError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: '', startDate: todayLocal(), dailyValue: '0' } });
  const submit = handleSubmit(async (values) => {
    try {
      setError('');
      await reviveApi.createAddiction({ nome_vicio: values.name, data_inicio: values.startDate, valor_economizado_por_dia: Number(values.dailyValue.replace(',', '.')) });
      if (user) await queryClient.invalidateQueries({ queryKey: bootstrapKey(user.id) });
      router.back();
    } catch (caught) { setError(toUserMessage(caught)); }
  });
  return (
    <Screen>
      <PageTitle title="Novo hábito" subtitle="Defina a data de início e o valor que deseja acompanhar." />
      <Card>
        <Controller control={control} name="name" render={({ field }) => <Field label="Hábito ou vício" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
        <Controller control={control} name="startDate" render={({ field }) => <Field label="Data de início (AAAA-MM-DD)" value={field.value} onChangeText={field.onChange} error={errors.startDate?.message} />} />
        <Controller control={control} name="dailyValue" render={({ field }) => <Field label="Economia por dia (R$)" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} error={errors.dailyValue?.message} />} />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        <AppButton title={isSubmitting ? 'Salvando...' : 'Salvar hábito'} disabled={isSubmitting} onPress={submit} />
        <AppButton title="Cancelar" variant="secondary" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}
