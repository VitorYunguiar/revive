import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSession } from '@/features/auth/session-context';
import { tokenStore } from '@/core/auth/token-store';
import { clearRemindersWithoutAccount, defaultReminderPreference, restoreAccountReminder, updateAccountReminder, type ReminderState } from '@/core/notifications/reminders';

type ReminderContextValue = {
  state: ReminderState;
  busy: boolean;
  refresh: () => Promise<void>;
  update: (hour: number, minute: number, enabled: boolean, requestPermission?: boolean) => Promise<ReminderState | undefined>;
};
const ReminderContext = createContext<ReminderContextValue | null>(null);

export function ReminderProvider({ children }: React.PropsWithChildren) {
  const { user, isRestoring } = useSession();
  const userId = user?.id;
  const [snapshot, setSnapshot] = useState<{ userId?: string; state: ReminderState; busy: boolean }>({ state: { preference: defaultReminderPreference(), status: 'off' }, busy: true });
  const editing = useRef(false);

  const refresh = useCallback(async () => {
    if (isRestoring) return;
    const generation = tokenStore.getGeneration();
    if (!userId) { await clearRemindersWithoutAccount().catch(() => undefined); return; }
    try {
      const state = await restoreAccountReminder(userId);
      if (tokenStore.isCurrent(generation)) setSnapshot({ userId, state, busy: false });
    } catch (error) {
      if (tokenStore.isCurrent(generation)) setSnapshot(previous => ({
        userId, busy: false,
        state: { preference: previous.userId === userId ? previous.state.preference : defaultReminderPreference(), status: 'error', message: error instanceof Error ? error.message : 'Não foi possível consultar o lembrete.' },
      }));
    }
  }, [userId, isRestoring]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    // Also notices a timezone/permission change while the app stays in foreground.
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 60_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [refresh]);

  const update = async (hour: number, minute: number, enabled: boolean, requestPermission = false) => {
    if (!userId || isRestoring || editing.current) return;
    const generation = tokenStore.getGeneration();
    editing.current = true;
    setSnapshot(previous => ({ ...previous, busy: true }));
    try {
      const state = await updateAccountReminder(userId, { hour, minute, enabled }, requestPermission);
      if (tokenStore.isCurrent(generation)) setSnapshot({ userId, state, busy: false });
      return state;
    } catch (error) {
      if (tokenStore.isCurrent(generation)) setSnapshot(previous => ({
        userId, busy: false,
        state: { preference: previous.userId === userId ? previous.state.preference : defaultReminderPreference(), status: 'error', message: error instanceof Error ? error.message : 'Não foi possível alterar o lembrete.' },
      }));
    } finally { editing.current = false; }
  };

  const state = snapshot.userId === userId ? snapshot.state : { preference: defaultReminderPreference(), status: 'off' as const };
  return <ReminderContext.Provider value={{ state, busy: isRestoring || snapshot.userId !== userId || snapshot.busy, refresh, update }}>{children}</ReminderContext.Provider>;
}

export function useReminder() {
  const context = useContext(ReminderContext);
  if (!context) throw new Error('useReminder exige ReminderProvider.');
  return context;
}
