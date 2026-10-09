import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/core/api/client';
import { toUserMessage } from '@/core/api/errors';
import { AppButton, Card, Field, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors } from '@/ui/theme';
import { z } from 'zod';

const emailSchema = z.email('Informe um e-mail válido.').max(254);
const passwordSchema = z.string().min(6, 'Use pelo menos 6 caracteres.')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula.')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Inclua um caractere especial.')
  .refine(value => {
    try { return encodeURIComponent(value).replace(/%[0-9A-F]{2}|./g, 'x').length <= 72; }
    catch { return false; }
  }, 'A senha deve ter até 72 bytes.');
type RequestReceipt = { request_id: string; reenviar_apos: number; mensagem: string };

export function PasswordRecoveryScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'confirm' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [requestId, setRequestId] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const mounted = useRef(true);
  const codeInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const confirmationInput = useRef<TextInput>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  const send = async () => {
    if (sending.current || (step === 'confirm' && Date.now() < resendAt)) return;
    const address = email.trim().toLowerCase();
    if (!emailSchema.safeParse(address).success) { setError('Informe um e-mail válido.'); return; }
    sending.current = true; setBusy(true); setError('');
    try {
      const receipt = await apiFetch<RequestReceipt>('/v2/auth/password-recovery/request', {
        authenticated: false, method: 'POST', body: JSON.stringify({ email: address }),
      });
      if (!mounted.current) return;
      setEmail(address); setRequestId(receipt.request_id); setCode('');
      setMessage(receipt.mensagem); setResendAt(Date.now() + 60_000); setStep('confirm');
      Keyboard.dismiss();
    } catch (caught) { if (mounted.current) setError(toUserMessage(caught)); }
    finally { sending.current = false; if (mounted.current) setBusy(false); }
  };
  const confirm = async () => {
    if (sending.current) return;
    if (!/^\d{8}$/.test(code)) { setError('Informe o código de oito dígitos.'); codeInput.current?.focus(); return; }
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Revise a nova senha.'); passwordInput.current?.focus(); return; }
    if (password !== confirmation) { setError('As senhas precisam ser iguais.'); confirmationInput.current?.focus(); return; }
    sending.current = true; setBusy(true); setError('');
    try {
      await apiFetch('/v2/auth/password-recovery/confirm', {
        authenticated: false, method: 'POST',
        body: JSON.stringify({ email, request_id: requestId, codigo: code, senha: password }),
      });
      if (!mounted.current) return;
      setCode(''); setPassword(''); setConfirmation(''); setEmail(''); setRequestId('');
      setStep('done'); Keyboard.dismiss();
    } catch (caught) { if (mounted.current) setError(toUserMessage(caught)); }
    finally { sending.current = false; if (mounted.current) setBusy(false); }
  };
  return <Screen>
    <PageTitle title="Recuperar senha" subtitle={step === 'done' ? 'Sua senha foi redefinida.' : 'Receba um código no e-mail da sua conta.'} />
    <Card>
      {step === 'request' ? <>
        <Field label="E-mail da conta" autoComplete="email" autoCorrect={false} autoCapitalize="none" keyboardType="email-address"
          maxLength={254} value={email} onChangeText={setEmail} editable={!busy} returnKeyType="send" onSubmitEditing={() => void send()} />
        <AppButton title="Solicitar código" loading={busy} onPress={() => void send()} />
      </> : step === 'confirm' ? <>
        <Text accessibilityLiveRegion="polite" style={textStyles.body}>{message}</Text>
        <Text style={textStyles.muted}>O código expira em dez minutos. Use apenas o código mais recente.</Text>
        <Field ref={codeInput} label="Código de oito dígitos" autoComplete="one-time-code" autoCorrect={false} keyboardType="number-pad"
          maxLength={8} value={code} onChangeText={value => setCode(value.replace(/\D/g, ''))} editable={!busy}
          returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} />
        <Field ref={passwordInput} label="Nova senha" autoComplete="new-password" autoCorrect={false} autoCapitalize="none" secureTextEntry
          value={password} onChangeText={setPassword} editable={!busy} returnKeyType="next" onSubmitEditing={() => confirmationInput.current?.focus()}
          hint="Pelo menos 6 caracteres, uma maiúscula e um caractere especial; até 72 bytes." />
        <Field ref={confirmationInput} label="Confirmar nova senha" autoComplete="new-password" autoCorrect={false} autoCapitalize="none" secureTextEntry
          value={confirmation} onChangeText={setConfirmation} editable={!busy} returnKeyType="done" onSubmitEditing={() => void confirm()} />
        <AppButton title="Redefinir senha" loading={busy} onPress={() => void confirm()} />
        <AppButton title={remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar código'} variant="secondary" disabled={busy || remaining > 0} onPress={() => void send()} />
        <AppButton title="Alterar e-mail" variant="secondary" disabled={busy} onPress={() => {
          setStep('request'); setCode(''); setPassword(''); setConfirmation(''); setRequestId(''); setError('');
        }} />
      </> : <Text accessibilityLiveRegion="polite" style={textStyles.body}>Entre com a nova senha. As sessões anteriores foram encerradas.</Text>}
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{error}</Text> : null}
      <AppButton title="Voltar ao login" variant="secondary" disabled={busy} onPress={() => router.replace('/(public)/login')} />
    </Card>
  </Screen>;
}
