import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import { useSession } from '@/features/auth/session-context';
import {
  authenticateWithDevice,
  authenticationErrorMessage,
  privacyLockPreferences,
  privacyScreenProtection,
} from '@/core/privacy/lock-service';
import { canRenderProtectedContent, privacyTransition, type AppVisibilityState } from '@/features/privacy/lock-state';
import { colors, spacing } from '@/ui/theme';

type LockAction = { ok: true } | { ok: false; message: string };
type PrivacyLockValue = {
  isEnabled: boolean;
  isLoading: boolean;
  setEnabled: (enabled: boolean) => Promise<LockAction>;
};

type LockState = {
  ownerUserId: string | null;
  checked: boolean;
  enabled: boolean;
  locked: boolean;
  busy: boolean;
  error: string | null;
};

const PrivacyLockContext = createContext<PrivacyLockValue | null>(null);
const initialState: LockState = { ownerUserId: null, checked: false, enabled: false, locked: true, busy: false, error: null };

async function protectScreen() {
  try {
    await privacyScreenProtection.enable();
  } catch {
    throw new Error('Não foi possível proteger a prévia deste aparelho. Tente novamente antes de abrir o conteúdo.');
  }
}

export function PrivacyLockProvider({ children }: React.PropsWithChildren) {
  const { user, isRestoring } = useSession();
  const [state, setState] = useState<LockState>(initialState);
  const stateRef = useRef(state);
  const userIdRef = useRef(user?.id ?? null);
  const authenticateRef = useRef<() => Promise<boolean>>(async () => false);
  const authenticationInFlight = useRef(false);
  const initialPromptedFor = useRef<string | null>(null);
  stateRef.current = state;
  userIdRef.current = user?.id ?? null;

  const loadPreference = useCallback(async (userId: string) => {
    setState({ ownerUserId: userId, checked: false, enabled: false, locked: true, busy: true, error: null });
    try {
      const enabled = await privacyLockPreferences.isEnabled(userId);
      if (userIdRef.current !== userId) return;
      if (enabled) await protectScreen();
      if (userIdRef.current !== userId) return;
      setState({ ownerUserId: userId, checked: true, enabled, locked: enabled, busy: false, error: null });
    } catch {
      if (userIdRef.current !== userId) return;
      setState({
        ownerUserId: userId, checked: false, enabled: false, locked: true, busy: false,
        error: 'Não foi possível carregar a proteção local. Tente novamente.',
      });
    }
  }, []);

  useEffect(() => {
    if (isRestoring) {
      setState((previous) => ({ ...previous, checked: false, locked: true }));
      return;
    }
    if (!user) {
      setState({ ownerUserId: null, checked: true, enabled: false, locked: false, busy: false, error: null });
      return;
    }
    void loadPreference(user.id);
  }, [isRestoring, loadPreference, user]);

  const unlock = useCallback(async () => {
    const userId = userIdRef.current;
    const current = stateRef.current;
    if (!userId || !current.enabled || current.ownerUserId !== userId || authenticationInFlight.current) return false;
    authenticationInFlight.current = true;
    setState((previous) => ({ ...previous, locked: true, busy: true, error: null }));
    try {
      await protectScreen();
      const result = await authenticateWithDevice('Desbloquear o Revive');
      if (!result.success) {
        if (userIdRef.current === userId) {
          setState((previous) => ({ ...previous, locked: true, busy: false, error: authenticationErrorMessage(result.error) }));
        }
        return false;
      }
      if (userIdRef.current !== userId) return false;
      setState((previous) => ({ ...previous, locked: false, busy: false, error: null }));
      return true;
    } catch (error) {
      if (userIdRef.current === userId) {
        setState((previous) => ({
          ...previous, locked: true, busy: false,
          error: error instanceof Error ? error.message : 'Não foi possível preparar a proteção deste aparelho.',
        }));
      }
      return false;
    } finally {
      authenticationInFlight.current = false;
    }
  }, []);
  authenticateRef.current = unlock;

  useEffect(() => {
    const userId = state.ownerUserId;
    if (!state.checked || !state.enabled || !state.locked || !userId || state.error) return;
    if (initialPromptedFor.current === userId) return;
    initialPromptedFor.current = userId;
    void unlock();
  }, [state.checked, state.enabled, state.error, state.locked, state.ownerUserId, unlock]);

  useEffect(() => {
    let previous = (AppState.currentState || 'unknown') as AppVisibilityState;
    const subscription = AppState.addEventListener('change', (next) => {
      const transition = privacyTransition(stateRef.current.enabled, previous, next as AppVisibilityState);
      if (transition === 'lock') {
        setState((current) => ({ ...current, locked: true, error: null }));
      } else if (transition === 'authenticate') {
        setState((current) => ({ ...current, locked: true, error: null }));
        void authenticateRef.current();
      }
      previous = next as AppVisibilityState;
    });
    return () => subscription.remove();
  }, []);

  const setEnabled = useCallback(async (enabled: boolean): Promise<LockAction> => {
    const userId = userIdRef.current;
    const current = stateRef.current;
    if (!userId || !current.checked || current.ownerUserId !== userId) {
      return { ok: false, message: 'A sessão ainda está sendo preparada. Tente novamente.' };
    }
    if (current.enabled === enabled) return { ok: true };
    setState((previous) => ({ ...previous, busy: true, error: null }));
    let protectionActivated = false;
    try {
      if (enabled) {
        const result = await authenticateWithDevice('Ativar bloqueio do Revive');
        if (!result.success) return { ok: false, message: authenticationErrorMessage(result.error) };
        await protectScreen();
        protectionActivated = true;
        if (userIdRef.current !== userId) {
          await privacyScreenProtection.disable().catch(() => undefined);
          return { ok: false, message: 'A conta mudou durante a configuração.' };
        }
        await privacyLockPreferences.enable(userId);
        if (userIdRef.current !== userId) {
          await privacyLockPreferences.clear(userId).catch(() => undefined);
          await privacyScreenProtection.disable().catch(() => undefined);
          return { ok: false, message: 'A conta mudou durante a configuração.' };
        }
        initialPromptedFor.current = userId;
        setState((previous) => ({ ...previous, enabled: true, locked: false, busy: false, error: null }));
        return { ok: true };
      }

      const result = await authenticateWithDevice('Desativar bloqueio do Revive');
      if (!result.success) return { ok: false, message: authenticationErrorMessage(result.error) };
      setState((previous) => ({ ...previous, locked: true, busy: true, error: null }));
      await privacyScreenProtection.disable();
      try {
        await privacyLockPreferences.clear(userId);
      } catch (error) {
        await protectScreen().catch(() => undefined);
        setState((previous) => ({ ...previous, locked: true, busy: false }));
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Não foi possível salvar a preferência. O bloqueio foi mantido.',
        };
      }
      if (userIdRef.current !== userId) return { ok: false, message: 'A conta mudou durante a configuração.' };
      initialPromptedFor.current = null;
      setState((previous) => ({ ...previous, enabled: false, locked: false, busy: false, error: null }));
      return { ok: true };
    } catch (error) {
      if (enabled && protectionActivated) await privacyScreenProtection.disable().catch(() => undefined);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Não foi possível atualizar a proteção local.',
      };
    } finally {
      setState((previous) => ({ ...previous, busy: false }));
    }
  }, []);

  const contentVisible = canRenderProtectedContent({
    restoringSession: isRestoring,
    userId: user?.id ?? null,
    ownerUserId: state.ownerUserId,
    preferenceLoaded: state.checked,
    enabled: state.enabled,
    locked: state.locked,
  });
  const showGate = (isRestoring || Boolean(user && !contentVisible));
  const isLoading = isRestoring || (Boolean(user) && (state.ownerUserId !== user?.id || (!state.checked && !state.error)));

  return (
    <PrivacyLockContext.Provider value={{ isEnabled: state.ownerUserId === user?.id && state.enabled, isLoading: state.busy || isLoading, setEnabled }}>
      <View style={styles.root}>
        {state.checked && state.ownerUserId === user?.id && user ? (
          <View
            testID="protected-layer"
            style={styles.content}
            pointerEvents={!contentVisible ? 'none' : 'auto'}
            accessibilityElementsHidden={!contentVisible}
            importantForAccessibility={!contentVisible ? 'no-hide-descendants' : 'auto'}
          >
            {children}
          </View>
        ) : null}
        {showGate ? (
          <PrivacyGate
            loading={isLoading}
            busy={state.busy}
            error={state.error}
            onRetry={() => {
              if (isLoading || state.busy) return;
              if (!state.checked && user) void loadPreference(user.id);
              else void unlock();
            }}
          />
        ) : null}
      </View>
    </PrivacyLockContext.Provider>
  );
}

function PrivacyGate({ loading, busy, error, onRetry }: { loading: boolean; busy: boolean; error: string | null; onRetry: () => void }) {
  return (
    <View style={styles.gate} accessibilityViewIsModal>
      <Fingerprint size={38} color={colors.primary} accessibilityElementsHidden />
      <Text accessibilityRole="header" style={styles.title}>{loading ? 'Preparando área protegida' : 'Conteúdo protegido'}</Text>
      <Text style={styles.description}>
        {loading ? 'Aguarde um instante.' : error || 'Confirme sua identidade com o aparelho para continuar.'}
      </Text>
      {!loading ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Desbloquear o Revive"
          accessibilityHint="Solicita autenticação do aparelho. O conteúdo permanece oculto até a confirmação."
          accessibilityState={{ disabled: busy, busy }}
          disabled={busy}
          onPress={onRetry}
          style={({ pressed }) => [styles.button, pressed && !busy && styles.pressed, busy && styles.disabled]}
        >
          {busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Desbloquear</Text>}
        </Pressable>
      ) : <ActivityIndicator color={colors.primary} />}
      <Text style={styles.privacyNote}>Este bloqueio protege a visualização. Ele não criptografa os dados locais do aparelho.</Text>
    </View>
  );
}

export function usePrivacyLock() {
  const value = useContext(PrivacyLockContext);
  if (!value) throw new Error('usePrivacyLock deve ser usado dentro de PrivacyLockProvider.');
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  gate: { ...StyleSheet.absoluteFill, zIndex: 10, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  description: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 360 },
  button: { minHeight: 52, minWidth: 190, borderRadius: 14, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.65 },
  privacyNote: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 350, marginTop: spacing.md },
});
