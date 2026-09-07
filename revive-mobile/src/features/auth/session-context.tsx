import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authRequest, refreshAccessToken, setSessionExpiredHandler } from '@/core/api/client';
import { reviveApi } from '@/core/api/repositories';
import { tokenStore } from '@/core/auth/token-store';
import { clearUserData, countPendingMutations } from '@/core/storage/database';
import { queryClient } from '@/core/query/client';
import type { AuthSession, User } from '@/domain/types';

type SessionContextValue = {
  user: User | null;
  isRestoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: (discardPending?: boolean) => Promise<{ pending: number }>;
  deleteAccount: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const saveSession = async (session: AuthSession) => {
  tokenStore.setAccessToken(session.access_token);
  await tokenStore.setRefreshToken(session.refresh_token);
  await tokenStore.setUser(session.usuario);
};

export function SessionProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const clearSession = useCallback(async () => {
    tokenStore.setAccessToken(null);
    setUser(null);
    queryClient.clear();
    await tokenStore.clear();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const refreshToken = await tokenStore.getRefreshToken();
        if (!refreshToken) return;
        await refreshAccessToken();
        const restoredUser = await tokenStore.getUser();
        if (active) setUser(restoredUser);
      } catch {
        // A network outage must not destroy the locally authenticated session.
        const offlineUser = await tokenStore.getUser();
        if (active) setUser(offlineUser);
      } finally {
        if (active) setIsRestoring(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const completeAuth = useCallback(async (session: AuthSession) => {
    await saveSession(session);
    setUser(session.usuario);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await authRequest('/v2/auth/login', { email, senha: password });
    await completeAuth(session);
  }, [completeAuth]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const session = await authRequest('/v2/auth/cadastro', { nome: name, email, senha: password });
    await completeAuth(session);
  }, [completeAuth]);

  const signOut = useCallback(async (discardPending = false) => {
    const currentUser = user;
    const pending = currentUser ? await countPendingMutations(currentUser.id) : 0;
    if (pending > 0 && !discardPending) return { pending };
    const refreshToken = await tokenStore.getRefreshToken();
    if (refreshToken) await reviveApi.logout(refreshToken).catch(() => undefined);
    if (currentUser) await clearUserData(currentUser.id);
    await clearSession();
    return { pending: 0 };
  }, [clearSession, user]);

  const deleteAccount = useCallback(async () => {
    const currentUser = user;
    await reviveApi.deleteAccount();
    if (currentUser) await clearUserData(currentUser.id);
    await clearSession();
  }, [clearSession, user]);

  const value = useMemo(() => ({ user, isRestoring, signIn, signUp, signOut, deleteAccount }), [user, isRestoring, signIn, signUp, signOut, deleteAccount]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession deve ser usado dentro de SessionProvider.');
  return value;
};
