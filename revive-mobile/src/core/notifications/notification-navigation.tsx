import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSession } from '@/features/auth/session-context';
import { usePrivacyLock } from '@/features/privacy/privacy-lock-provider';
import { tokenStore } from '@/core/auth/token-store';
import { claimNotificationIntent, notificationIntent, type NotificationIntent } from './notification-intent';

const IntentContext = createContext<{ pending: NotificationIntent | null; handled: (key: string) => void } | null>(null);

/** Lives across login/restoration. Capturing a tap never navigates or saves. */
export function NotificationIntentProvider({ children }: React.PropsWithChildren) {
  const [pending, setPending] = useState<NotificationIntent | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const capture = (response: Notifications.NotificationResponse) => {
      const intent = notificationIntent(response);
      if (intent) setPending(previous => previous?.key === intent.key ? previous : intent);
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(capture);
    const initial = Notifications.getLastNotificationResponse();
    if (initial) capture(initial);
    return () => subscription.remove();
  }, []);
  const handled = useCallback((key: string) => {
    setPending(previous => previous?.key === key ? null : previous);
    const last = Notifications.getLastNotificationResponse();
    if (last && notificationIntent(last)?.key === key) Notifications.clearLastNotificationResponse();
  }, []);
  const value = useMemo(() => ({ pending, handled }), [pending, handled]);
  return <IntentContext.Provider value={value}>{children}</IntentContext.Provider>;
}

/** Mounts inside the privacy gate; a cold-start tap waits for both gates. */
export function NotificationNavigation() {
  const intentContext = useContext(IntentContext);
  const { user, isRestoring } = useSession();
  const { canOpenContent } = usePrivacyLock();
  const router = useRouter();
  const processing = useRef(false);
  const claimed = useRef<string | null>(null);
  const [revision, setRevision] = useState(0);
  const pending = intentContext?.pending;
  const handled = intentContext?.handled;
  const owner = user?.id;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') setRevision(previous => previous + 1); });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!pending || isRestoring || !owner || !canOpenContent || AppState.currentState !== 'active' || processing.current || !handled) return;
    const generation = tokenStore.getGeneration();
    processing.current = true;
    let active = true;
    void (async () => {
      try {
        if (claimed.current !== pending.key) {
          if (!await claimNotificationIntent(pending.key)) { handled(pending.key); return; }
          claimed.current = pending.key;
        }
        const storedUser = await tokenStore.getUser();
        // A lock/background transition during native storage I/O leaves the intent pending.
        if (!active || AppState.currentState !== 'active') return;
        if (tokenStore.isCurrent(generation) && storedUser?.id === owner && pending.ownerId === owner) {
          router.push(pending.path as never);
        }
        claimed.current = null;
        handled(pending.key);
        await Notifications.dismissNotificationAsync(pending.identifier);
      } catch {
        // Storage/native failure must not bypass a gate or create an unhandled rejection.
      } finally {
        processing.current = false;
        if (!active) setRevision(previous => previous + 1);
      }
    })();
    return () => { active = false; };
  }, [pending, owner, isRestoring, canOpenContent, router, handled, revision]);
  return null;
}
