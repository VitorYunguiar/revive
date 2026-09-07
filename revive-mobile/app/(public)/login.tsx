import React, { useState } from 'react';
import { Text } from 'react-native';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginForm } from '@/features/auth/schemas';
import { useSession } from '@/features/auth/session-context';
import { toUserMessage } from '@/core/api/errors';
import { AppButton, Card, Field, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors } from '@/ui/theme';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [error, setError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setError('');
    try {
      await signIn(values.email.trim().toLowerCase(), values.password);
    } catch (caught) {
      setError(toUserMessage(caught));
    }
  });

  return (
    <Screen>
      <PageTitle title="Volte para sua jornada" subtitle="Entre para acompanhar seu progresso com privacidade." />
      <Card>
        <Controller control={control} name="email" render={({ field }) => (
          <Field label="E-mail" autoCapitalize="none" keyboardType="email-address" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} />
        )} />
        <Controller control={control} name="password" render={({ field }) => (
          <Field label="Senha" secureTextEntry value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} />
        )} />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        <AppButton title={isSubmitting ? 'Entrando...' : 'Entrar'} disabled={isSubmitting} onPress={submit} />
      </Card>
      <Text style={textStyles.muted}>Ainda não tem conta? <Link href="/(public)/cadastro" style={{ color: colors.primary }}>Criar conta</Link></Text>
      <Text style={textStyles.muted}>O Revive é uma ferramenta de autocuidado e não substitui acompanhamento profissional.</Text>
    </Screen>
  );
}
