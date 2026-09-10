import React, { useState } from 'react';
import { Text } from 'react-native';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpForm } from '@/features/auth/schemas';
import { useSession } from '@/features/auth/session-context';
import { toUserMessage } from '@/core/api/errors';
import { AppButton, Card, Field, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors } from '@/ui/theme';

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [error, setError] = useState('');
  const { control, handleSubmit, setFocus, formState: { errors, isSubmitting } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const submit = handleSubmit(async (values) => {
    setError('');
    try {
      await signUp(values.name.trim(), values.email.trim().toLowerCase(), values.password);
    } catch (caught) {
      setError(toUserMessage(caught));
    }
  });
  return (
    <Screen>
      <PageTitle title="Comece um novo capítulo" subtitle="Crie sua conta Revive." />
      <Card>
        <Controller control={control} name="name" render={({ field }) => <Field ref={field.ref} autoComplete="name" returnKeyType="next" onSubmitEditing={() => setFocus('email')} label="Nome" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.name?.message} />} />
        <Controller control={control} name="email" render={({ field }) => <Field ref={field.ref} autoComplete="email" autoCorrect={false} returnKeyType="next" onSubmitEditing={() => setFocus('password')} label="E-mail" autoCapitalize="none" keyboardType="email-address" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} />} />
        <Controller control={control} name="password" render={({ field }) => <Field ref={field.ref} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" returnKeyType="go" onSubmitEditing={() => { if (!isSubmitting) void submit(); }} label="Senha" secureTextEntry value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} />} />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        <AppButton title={isSubmitting ? 'Criando...' : 'Criar conta'} disabled={isSubmitting} onPress={submit} />
      </Card>
      <Text style={textStyles.muted}>Já possui conta? <Link href="/(public)/login" style={{ color: colors.primary }}>Entrar</Link></Text>
    </Screen>
  );
}
